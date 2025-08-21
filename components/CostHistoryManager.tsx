'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit3, Trash2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { CostHistory } from '@/lib/types';
import { formatNumberWithCommas, parseNumberFromString } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// 커스텀 플러그인: 기준선 위에 퍼센트 표시
const customLineLabelsPlugin = {
  id: 'customLineLabels',
  afterDraw: function(chart: any) {
    const ctx = chart.ctx;
    const datasets = chart.data.datasets;
    
    datasets.forEach((dataset: any, datasetIndex: number) => {
      if (dataset.type === 'line' && dataset.label.includes('기준선')) {
        const meta = chart.getDatasetMeta(datasetIndex);
        const data = dataset.data;
        
        // 더미 끝점에 퍼센트 표시
        const dummyEndIndex = data.length - 1; // 더미 끝점
        if (meta.data[dummyEndIndex]) {
          const point = meta.data[dummyEndIndex];
          const x = point.x;
          const y = point.y;
          
          // 퍼센트 계산
          const percentage = dataset.label.includes('100%') ? '100%' : '70%';
          const color = dataset.label.includes('100%') ? '#DC2626' : '#D97706';
          
          // 텍스트 스타일 설정
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = color;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          
          // 퍼센트 표시
          ctx.fillText(percentage, x + 5, y - 5);
        }
      }
    });
  }
};

ChartJS.register(customLineLabelsPlugin);

interface CostHistoryManagerProps {
  projectId: string;
  projectName: string;
  currentBudget: number;
  currentActualCost: number;
  costHistory: CostHistory[];
  onSave: (history: CostHistory[]) => void;
  onClose: () => void;
}

export default function CostHistoryManager({
  projectId,
  projectName,
  currentBudget,
  currentActualCost,
  costHistory,
  onSave,
  onClose
}: CostHistoryManagerProps) {
  const [histories, setHistories] = useState<CostHistory[]>(costHistory || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 현재 예산, 실제비용, 투입률 상태 (이력 기반으로 자동 업데이트)
  const [currentValues, setCurrentValues] = useState({
    budget: 0,
    actualCost: 0,
    costRatio: 0
  });
  
  // 새 이력 입력 폼 상태
  const [newHistory, setNewHistory] = useState({
    actualCost: 0,
    budget: 0,
    note: '',
    manager: '',
    changeReason: ''
  });

  // 편집 중인 이력 상태
  const [editingHistory, setEditingHistory] = useState<CostHistory | null>(null);

  // 현재 값들을 업데이트하는 함수 (중앙화된 로직)
  const updateCurrentValues = useCallback((historiesArray: CostHistory[]) => {
    console.log('updateCurrentValues 호출됨:', historiesArray);
    
         if (historiesArray.length > 0) {
       // 테이블 표시 순서와 일치하도록 마지막 항목을 최신 이력으로 사용
       // (테이블에서 과거순으로 정렬하므로 마지막이 최신)
       const latestHistory = historiesArray[historiesArray.length - 1];
      
      const newCostRatio = calculateCostRatio(latestHistory.actualCost, latestHistory.budget);
      
             console.log('최신 이력 기반으로 현재값 업데이트 (테이블 표시 순서 기준):', {
         arrayIndex: historiesArray.length - 1,
         budget: latestHistory.budget,
         actualCost: latestHistory.actualCost,
         costRatio: newCostRatio
       });
      
      setCurrentValues({
        budget: latestHistory.budget,
        actualCost: latestHistory.actualCost,
        costRatio: newCostRatio
      });
      
      // 새 이력 입력 폼의 기본값도 업데이트
      setNewHistory(prev => ({
        ...prev,
        actualCost: latestHistory.actualCost,
        budget: latestHistory.budget
      }));
    } else {
      // 이력이 없으면 props로 받은 값 사용
      const fallbackCostRatio = calculateCostRatio(currentActualCost || 0, currentBudget || 0);
      
      console.log('이력 없음, props 값 사용:', {
        budget: currentBudget || 0,
        actualCost: currentActualCost || 0,
        costRatio: fallbackCostRatio
      });
      
      setCurrentValues({
        budget: currentBudget || 0,
        actualCost: currentActualCost || 0,
        costRatio: fallbackCostRatio
      });
      
      setNewHistory(prev => ({
        ...prev,
        actualCost: currentActualCost || 0,
        budget: currentBudget || 0
      }));
    }
  }, [currentBudget, currentActualCost]);

  // 초기 로딩 시 현재 값들을 설정
  useEffect(() => {
    updateCurrentValues(costHistory || []);
  }, [costHistory, updateCurrentValues]);

  // 이력이 변경될 때마다 현재 값들을 자동 업데이트
  useEffect(() => {
    updateCurrentValues(histories);
  }, [histories, updateCurrentValues]);

  // 실시간 동기화를 위한 useEffect (무한 루프 방지)
  useEffect(() => {
    // 초기 로딩 시에는 저장하지 않음
    if (histories !== costHistory && histories.length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('CostHistoryManager: 이력 변경 감지, 저장 실행:', histories);
        onSave(histories);
      }, 500); // 500ms 디바운스
      
      return () => clearTimeout(timeoutId);
    }
  }, [histories, onSave, costHistory]);

  // 투입률 계산
  const calculateCostRatio = (actual: number, budget: number): number => {
    return budget > 0 ? Math.round((actual / budget) * 100 * 100) / 100 : 0;
  };

  // 투입률 색상 클래스
  const getCostRatioColor = (ratio: number): string => {
    if (ratio > 100) return "bg-red-100 text-red-700";
    if (ratio >= 80) return "bg-red-100 text-red-700";
    if (ratio >= 70) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  // 차트 데이터 생성
  const chartData = {
    labels: [
      '시작', // 더미 시작점
      ...histories.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(h => h.date),
      '현재' // 더미 끝점
    ],
    datasets: [
      {
        type: 'bar' as const,
        label: '실제 비용',
        data: [
          0, // 더미 시작점 (표시 안됨)
          ...histories.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(h => h.actualCost),
          0 // 더미 끝점 (표시 안됨)
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        order: 3
      },
      {
        type: 'line' as const,
        label: '100% 기준선',
        data: [
          Math.max(...histories.map(h => h.budget)), // 더미 시작점
          ...histories.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(h => h.budget),
          Math.max(...histories.map(h => h.budget)) // 더미 끝점
        ],
        borderColor: 'rgba(239, 68, 68, 0.8)',
        borderWidth: 3,
        borderDash: [8, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2,
        order: 1,
        tension: 0,
        spanGaps: true
      },
      {
        type: 'line' as const,
        label: '70% 기준선',
        data: [
          Math.max(...histories.map(h => h.budget)) * 0.7, // 더미 시작점
          ...histories.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(h => h.budget * 0.7),
          Math.max(...histories.map(h => h.budget)) * 0.7 // 더미 끝점
        ],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        borderWidth: 2,
        borderDash: [4, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgba(245, 158, 11, 1)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2,
        order: 2,
        tension: 0,
        spanGaps: true
      }
    ]
  };

  // 차트 옵션
  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // 레전드 숨김
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}원`;
          }
        }
      },
      // 막대 그래프 내부에 금액 표시
      datalabels: {
        display: function(context: any) {
          // 더미 데이터 포인트는 표시하지 않음
          if (context.dataIndex === 0 || context.dataIndex === histories.length + 1) {
            return false;
          }
          return context.dataset.type === 'bar';
        },
        color: 'white',
        anchor: 'center',
        align: 'center',
        font: {
          size: 11,
          weight: 'bold'
        },
        formatter: function(value: number) {
          return value.toLocaleString();
        }
      } as any,
      // 커스텀 플러그인은 ChartJS.register로 등록되어 자동 활성화됨
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280',
          callback: function(value: any, index: number) {
            // 더미 데이터 포인트는 라벨 숨김
            if (index === 0 || index === histories.length + 1) {
              return '';
            }
            return this.getLabelForValue(value);
          }
        }
      },
      y: {
        display: false, // y축 숨김
        beginAtZero: true,
        // 예산 선 위에 여유 공간 확보 (최대값의 20% 여유)
        suggestedMax: (() => {
          const maxValue = Math.max(...histories.map(h => Math.max(h.actualCost, h.budget)));
          return maxValue * 1.2;
        })()
      }
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  // 새 이력 추가
  const handleAddHistory = () => {
    if (!newHistory.manager.trim()) {
      alert('담당자를 입력해주세요.');
      return;
    }

    const history: CostHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      actualCost: newHistory.actualCost,
      budget: newHistory.budget,
      costRatio: calculateCostRatio(newHistory.actualCost, newHistory.budget),
      note: newHistory.note,
      manager: newHistory.manager,
      changeReason: newHistory.changeReason
    };

    const newHistories = [...histories, history];
    setHistories(newHistories);
    
    // 폼 초기화
    setNewHistory({
      actualCost: newHistory.actualCost, // 새로 추가된 값 유지
      budget: newHistory.budget, // 새로 추가된 값 유지
      note: '',
      manager: '',
      changeReason: ''
    });
    setIsAdding(false);
  };

  // 이력 편집 시작
  const handleEditStart = (history: CostHistory) => {
    setEditingId(history.id);
    setEditingHistory({ ...history });
  };

  // 이력 편집 저장
  const handleEditSave = () => {
    if (!editingHistory) return;

    const newHistories = histories.map(h => 
      h.id === editingHistory.id ? editingHistory : h
    );
    setHistories(newHistories);
    setEditingId(null);
    setEditingHistory(null);
    
    console.log('이력 편집 완료:', editingHistory);
    console.log('새로운 이력 배열:', newHistories);
  };

  // 이력 편집 취소
  const handleEditCancel = () => {
    setEditingId(null);
    setEditingHistory(null);
  };

  // 이력 삭제
  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const newHistories = histories.filter(h => h.id !== id);
      setHistories(newHistories);
      
      console.log('이력 삭제 완료, ID:', id);
      console.log('새로운 이력 배열:', newHistories);
    }
  };

  // 변경 사유 옵션
  const changeReasons = [
    '예산 증가',
    '예산 감소',
    '실제 비용 증가',
    '실제 비용 감소',
    '예산 조정',
    '비용 정산',
    '기타'
  ];

  // 저장 및 닫기
  const handleSaveAndClose = () => {
    // 이미 useEffect에서 저장되므로 닫기만 처리
    onClose();
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          투입률 이력관리 - {projectName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 현재 투입률 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600">현재 예산</div>
            <div className="text-xl font-bold text-blue-600">
              {currentValues.budget.toLocaleString()}원
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">현재 실제비용</div>
            <div className="text-xl font-bold text-green-600">
              {currentValues.actualCost.toLocaleString()}원
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">현재 투입률</div>
            <div className={`text-xl font-bold ${getCostRatioColor(currentValues.costRatio)}`}>
              {currentValues.costRatio}%
            </div>
          </div>
        </div>

        {/* 투입률 이력 차트 */}
        {histories.length > 0 && (
          <Card className="p-4 border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">투입률 이력 추이</h3>
            </div>
            <div className="relative">
              <div className="h-80">
                <Chart type="bar" data={chartData as any} options={chartOptions as any} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 text-center">
              💡 왼쪽(과거) → 오른쪽(최신) | 파란색 막대: 실제 비용 (내부에 금액 표시), 빨간색 점선: 100% 기준선, 주황색 점선: 70% 기준선
            </div>
          </Card>
        )}

        {/* 새 이력 추가 폼 */}
        {!isAdding ? (
          <Button onClick={() => setIsAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            새 투입률 이력 추가
          </Button>
        ) : (
          <Card className="p-4 border-2 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actualCost">실제 비용</Label>
                <Input
                  id="actualCost"
                  type="text"
                  value={formatNumberWithCommas(newHistory.actualCost)}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const numericValue = parseNumberFromString(rawValue);
                    if (!isNaN(numericValue)) {
                      setNewHistory({
                        ...newHistory,
                        actualCost: numericValue
                      });
                    }
                  }}
                  placeholder="실제 비용을 입력하세요 (예: 1,000,000)"
                />
              </div>
              <div>
                <Label htmlFor="budget">예산</Label>
                <Input
                  id="budget"
                  type="text"
                  value={formatNumberWithCommas(newHistory.budget)}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const numericValue = parseNumberFromString(rawValue);
                    if (!isNaN(numericValue)) {
                      setNewHistory({
                        ...newHistory,
                        budget: numericValue
                      });
                    }
                  }}
                  placeholder="예산을 입력하세요 (예: 1,000,000)"
                />
              </div>
              <div>
                <Label htmlFor="manager">담당자</Label>
                <Input
                  id="manager"
                  value={newHistory.manager}
                  onChange={(e) => setNewHistory({
                    ...newHistory,
                    manager: e.target.value
                  })}
                  placeholder="담당자명을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="changeReason">변경 사유</Label>
                <Select
                  value={newHistory.changeReason}
                  onValueChange={(value) => setNewHistory({
                    ...newHistory,
                    changeReason: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="변경 사유를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {changeReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="note">비고</Label>
                <Textarea
                  id="note"
                  value={newHistory.note}
                  onChange={(e) => setNewHistory({
                    ...newHistory,
                    note: e.target.value
                  })}
                  placeholder="추가 설명을 입력하세요"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddHistory} className="flex-1">
                추가
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAdding(false)}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </Card>
        )}

        {/* 이력 테이블 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">투입률 이력</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순서</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>예산</TableHead>
                  <TableHead>실제비용</TableHead>
                  <TableHead>투입률</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>변경사유</TableHead>
                  <TableHead>비고</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {histories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      등록된 투입률 이력이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  histories.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((history, index) => (
                    <TableRow key={history.id}>
                      <TableCell className="text-sm">{index + 1}</TableCell>
                      <TableCell className="text-sm">{history.date}</TableCell>
                      <TableCell className="text-sm">
                        {editingId === history.id ? (
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editingHistory?.budget || 0)}
                            onChange={(e) => {
                              const rawValue = e.target.value;
                              const numericValue = parseNumberFromString(rawValue);
                              if (!isNaN(numericValue) && editingHistory) {
                                setEditingHistory({
                                  ...editingHistory,
                                  budget: numericValue
                                });
                              }
                            }}
                            className="w-20 text-sm"
                          />
                        ) : (
                          `${history.budget.toLocaleString()}원`
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {editingId === history.id ? (
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editingHistory?.actualCost || 0)}
                            onChange={(e) => {
                              const rawValue = e.target.value;
                              const numericValue = parseNumberFromString(rawValue);
                              if (!isNaN(numericValue) && editingHistory) {
                                setEditingHistory({
                                  ...editingHistory,
                                  actualCost: numericValue
                                });
                              }
                            }}
                            className="w-20 text-sm"
                          />
                        ) : (
                          `${history.actualCost.toLocaleString()}원`
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCostRatioColor(history.costRatio)}>
                          {history.costRatio}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{history.manager}</TableCell>
                      <TableCell className="text-sm">{history.changeReason || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate" title={history.note || ''}>
                        {history.note || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingId === history.id ? (
                            <>
                              <Button size="sm" onClick={handleEditSave}>
                                저장
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleEditCancel}>
                                취소
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditStart(history)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDelete(history.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={handleSaveAndClose}>
            저장 후 닫기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}