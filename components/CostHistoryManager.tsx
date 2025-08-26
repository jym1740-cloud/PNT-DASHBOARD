'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Edit, Trash2, Save, X, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CostHistory, Project } from '@/lib/types';
import { safeMax, safeMin, safeNumber, validateChartData, validateChartOptions } from '@/lib/utils';
import ChartErrorBoundary from './ChartErrorBoundary';

// Chart.js 컴포넌트를 동적으로 import하여 SSR 비활성화
const Chart = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })), {
  ssr: false,
  loading: () => (
    <div className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">차트를 불러오는 중...</p>
      </div>
    </div>
  )
});

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
  const [history, setHistory] = useState<CostHistory[]>(costHistory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<CostHistory>>({});
  const [chartError, setChartError] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // Chart.js 초기화 함수
  const initializeChartJS = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;

      const ChartJS = await import('chart.js/auto');
      const DataLabelsPlugin = await import('chartjs-plugin-datalabels');
      
      // 플러그인 안전 등록
      if (ChartJS.default && DataLabelsPlugin.default) {
        ChartJS.default.register(DataLabelsPlugin.default);
        console.log('Chart.js 및 플러그인이 성공적으로 등록되었습니다.');
        setIsChartReady(true);
      }
    } catch (error) {
      console.error('Chart.js 초기화 실패:', error);
      setChartError('차트 라이브러리 초기화에 실패했습니다.');
    }
  }, []);

  // 컴포넌트 마운트 시 Chart.js 초기화
  useEffect(() => {
    initializeChartJS();
  }, [initializeChartJS]);

  // 현재 값 업데이트 함수
  const updateCurrentValues = useCallback((historyArray: CostHistory[]) => {
    try {
      if (!Array.isArray(historyArray) || historyArray.length === 0) {
        console.log('updateCurrentValues: 빈 이력 배열');
        return;
      }

      console.log('updateCurrentValues 호출됨:', historyArray);
      
      // 테이블 표시 순서와 일치하도록 첫 번째 항목을 최신 이력으로 사용
      const latestHistory = historyArray[0];
      
      console.log('최신 이력 기반으로 현재값 업데이트 (테이블 표시 순서 기준):', latestHistory);
      
      // 안전한 값 변환
      const budget = safeNumber(latestHistory.budget, 0);
      const actualCost = safeNumber(latestHistory.actualCost, 0);
      
      // 투입률 계산
      const costRatio = budget > 0 ? (actualCost / budget) * 100 : 0;
      
      console.log('계산된 값들:', { budget, actualCost, costRatio });
      
    } catch (error) {
      console.error('updateCurrentValues 실행 중 오류:', error);
    }
  }, []);

  // 투입률 계산 함수
  const calculateCostRatio = useCallback((budget: number, actualCost: number): number => {
    try {
      if (budget <= 0) return 0;
      return (actualCost / budget) * 100;
    } catch (error) {
      console.error('투입률 계산 중 오류:', error);
      return 0;
    }
  }, []);

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    try {
      if (!Array.isArray(history) || history.length === 0) {
        return {
          labels: [],
          datasets: []
        };
      }

      // 날짜순으로 정렬 (최신이 뒤로)
      const sortedHistory = [...history].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const data = {
        labels: sortedHistory.map(h => h.date),
        datasets: [
          {
            label: '예산',
            data: sortedHistory.map(h => h.budget),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1,
            fill: false
          },
          {
            label: '실제 비용',
            data: sortedHistory.map(h => h.actualCost),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.1,
            fill: false
          }
        ]
      };

      // 데이터 유효성 검사
      if (!validateChartData(data)) {
        console.warn('차트 데이터 유효성 검사 실패');
        return { labels: [], datasets: [] };
      }

      return data;
    } catch (error) {
      console.error('차트 데이터 생성 중 오류:', error);
      return { labels: [], datasets: [] };
    }
  }, [history]);

  // 차트 옵션 생성
  const chartOptions = useMemo(() => {
    try {
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: true,
            color: '#374151',
            font: {
              weight: 'bold'
            },
            formatter: (value: number) => {
              return value.toLocaleString();
            }
          },
          legend: {
            display: true,
            position: 'top' as const
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                return value.toLocaleString();
              }
            }
          }
        }
      };

      // 옵션 유효성 검사
      if (!validateChartOptions(options)) {
        console.warn('차트 옵션 유효성 검사 실패');
        return {};
      }

      return options;
    } catch (error) {
      console.error('차트 옵션 생성 중 오류:', error);
      return {};
    }
  }, []);

  // 안전한 최대 예산 계산
  const getSafeMaxBudget = useCallback(() => {
    try {
      if (!Array.isArray(history) || history.length === 0) {
        return Math.max(currentBudget, currentActualCost, 1000000);
      }
      
      const budgets = history.map(h => h.budget).filter(b => b > 0);
      const actualCosts = history.map(h => h.actualCost).filter(c => c > 0);
      
      const maxBudget = safeMax(budgets);
      const maxActualCost = safeMax(actualCosts);
      const currentMax = Math.max(currentBudget, currentActualCost);
      
      return Math.max(maxBudget, maxActualCost, currentMax, 1000000);
    } catch (error) {
      console.error('최대 예산 계산 중 오류:', error);
      return Math.max(currentBudget, currentActualCost, 1000000);
    }
  }, [history, currentBudget, currentActualCost]);

  // 이력 추가 핸들러
  const handleAddHistory = useCallback(() => {
    try {
      const newHistory: CostHistory = {
        id: `history_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        budget: currentBudget,
        actualCost: currentActualCost,
        description: ''
      };
      
      setHistory(prev => [newHistory, ...prev]);
      updateCurrentValues([newHistory, ...history]);
    } catch (error) {
      console.error('이력 추가 중 오류:', error);
    }
  }, [currentBudget, currentActualCost, history, updateCurrentValues]);

  // 편집 시작 핸들러
  const handleEditStart = useCallback((item: CostHistory) => {
    try {
      setEditingId(item.id);
      setEditingItem({ ...item });
    } catch (error) {
      console.error('편집 시작 중 오류:', error);
    }
  }, []);

  // 편집 저장 핸들러
  const handleEditSave = useCallback(() => {
    try {
      if (!editingId || !editingItem.date || editingItem.budget === undefined || editingItem.actualCost === undefined) {
        return;
      }

      setHistory(prev => 
        prev.map(item => 
          item.id === editingId 
            ? { ...item, ...editingItem }
            : item
        )
      );

      setEditingId(null);
      setEditingItem({});
    } catch (error) {
      console.error('편집 저장 중 오류:', error);
    }
  }, [editingId, editingItem]);

  // 삭제 핸들러
  const handleDelete = useCallback((id: string) => {
    try {
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('삭제 중 오류:', error);
    }
  }, []);

  // 저장 및 닫기 핸들러
  const handleSaveAndClose = useCallback(() => {
    try {
      onSave(history);
      onClose();
    } catch (error) {
      console.error('저장 및 닫기 중 오류:', error);
    }
  }, [history, onSave, onClose]);

  // 차트 에러 처리
  const handleChartError = useCallback((error: Error) => {
    console.error('Chart.js 렌더링 오류:', error);
    setChartError('차트를 표시할 수 없습니다.');
  }, []);

  if (chartError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">차트 오류</h3>
            <p className="text-red-600 text-sm mb-4">{chartError}</p>
            <Button onClick={onClose} variant="outline">닫기</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">투입률 이력 관리</h2>
              <p className="text-gray-600">{projectName}</p>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 현재 상태 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">현재 예산</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {currentBudget.toLocaleString()}원
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">현재 실제 비용</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {currentActualCost.toLocaleString()}원
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">투입률</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {calculateCostRatio(currentBudget, currentActualCost).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 차트 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                투입률 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartErrorBoundary onError={handleChartError}>
                  {isChartReady && Chart && (
                    <Chart data={chartData} options={chartOptions} />
                  )}
                </ChartErrorBoundary>
              </div>
            </CardContent>
          </Card>

          {/* 이력 관리 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  투입률 이력
                </CardTitle>
                <Button onClick={handleAddHistory} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  이력 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">날짜</th>
                      <th className="text-left p-2">예산</th>
                      <th className="text-left p-2">실제 비용</th>
                      <th className="text-left p-2">투입률</th>
                      <th className="text-left p-2">비고</th>
                      <th className="text-left p-2">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        {editingId === item.id ? (
                          <>
                            <td className="p-2">
                              <Input
                                type="date"
                                value={editingItem.date || ''}
                                onChange={(e) => setEditingItem(prev => ({ ...prev, date: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={editingItem.budget || ''}
                                onChange={(e) => setEditingItem(prev => ({ ...prev, budget: Number(e.target.value) }))}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={editingItem.actualCost || ''}
                                onChange={(e) => setEditingItem(prev => ({ ...prev, actualCost: Number(e.target.value) }))}
                              />
                            </td>
                            <td className="p-2">
                              {editingItem.budget && editingItem.actualCost
                                ? `${calculateCostRatio(editingItem.budget, editingItem.actualCost).toFixed(1)}%`
                                : '-'
                              }
                            </td>
                            <td className="p-2">
                              <Input
                                value={editingItem.description || ''}
                                onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="비고"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button onClick={handleEditSave} size="sm" className="bg-green-600 hover:bg-green-700">
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingItem({});
                                  }} 
                                  size="sm" 
                                  variant="outline"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2">{item.date}</td>
                            <td className="p-2">{item.budget.toLocaleString()}원</td>
                            <td className="p-2">{item.actualCost.toLocaleString()}원</td>
                            <td className="p-2">
                              <span className={`font-medium ${
                                calculateCostRatio(item.budget, item.actualCost) > 80 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`}>
                                {calculateCostRatio(item.budget, item.actualCost).toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-2">{item.description || '-'}</td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button 
                                  onClick={() => handleEditStart(item)} 
                                  size="sm" 
                                  variant="outline"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  onClick={() => handleDelete(item.id)} 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} variant="outline">
              취소
            </Button>
            <Button onClick={handleSaveAndClose} className="bg-blue-600 hover:bg-blue-700">
              저장 및 닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}