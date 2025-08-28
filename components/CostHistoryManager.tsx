'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Edit, Trash2, Save, X, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';
import { CostHistory } from '@/lib/types';
import { safeMax, safeMin, safeNumber } from '@/lib/utils';

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

  // 투입률 상태에 따른 색상 및 아이콘 (프로젝트 테이블과 동일 기준)
  const getCostRatioDisplay = useCallback((budget: number, actualCost: number) => {
    const ratio = calculateCostRatio(budget, actualCost);
    
    if (ratio > 100) {
      return { color: 'text-red-600 font-semibold', bgColor: 'bg-red-50', icon: '🔴', status: '위험' };
    } else if (ratio >= 80) {
      return { color: 'text-red-600', bgColor: 'bg-red-50', icon: '🔴', status: '주의' };
    } else if (ratio >= 70) {
      return { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: '🟡', status: '관리필요' };
    } else if (ratio > 0) {
      return { color: 'text-green-600', bgColor: 'bg-green-50', icon: '🟢', status: '정상' };
    } else {
      return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: '⚪', status: '계획' };
    }
  }, [calculateCostRatio]);

  // 차트 데이터 및 기준선 계산
  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 데이터 내에서 년도가 여러 개인지 확인
    const years = Array.from(new Set(sortedHistory.map(item => new Date(item.date).getFullYear())));
    const hasMultipleYears = years.length > 1;
    
    return sortedHistory.map((item, index) => {
      const isLatest = index === sortedHistory.length - 1;
      const ratio = calculateCostRatio(item.budget, item.actualCost);
      
      // 최신 데이터의 색상은 프로젝트 상태에 따라 결정
      let barColor = '#6b7280'; // 기본 회색 (과거 데이터)
      if (isLatest) {
        if (ratio > 100) {
          barColor = '#dc2626'; // 빨간색 (위험)
        } else if (ratio >= 80) {
          barColor = '#ea580c'; // 주황색 (주의)
        } else if (ratio >= 70) {
          barColor = '#d97706'; // 노란색 (관리필요)
        } else {
          barColor = '#059669'; // 녹색 (정상)
        }
      }
      
      return {
        date: item.date,
        투입액: Number((item.actualCost / 100000000).toFixed(2)), // 억원 단위
        투입률: Number(ratio.toFixed(1)), // %
        예산: Number((item.budget / 100000000).toFixed(2)), // 예산 (억원 단위)
        예산70: Number((item.budget * 0.7 / 100000000).toFixed(2)), // 예산의 70% (억원 단위)
        hasMultipleYears, // X축 포맷팅을 위한 플래그
        barColor, // 막대 색상
        isLatest // 최신 여부
      };
    });
  }, [history, calculateCostRatio]);

  // 기준선 값 계산 (고정값)
  const referenceLines = useMemo(() => {
    if (chartData.length === 0) return { budget100: 0, budget70: 0 };
    
    // 최신 예산을 기준으로 고정 기준선 설정
    const latestBudget = Math.max(...chartData.map(d => d.예산));
    return {
      budget100: latestBudget, // 100% 기준선
      budget70: latestBudget * 0.7 // 70% 기준선
    };
  }, [chartData]);

  // 이력 추가
  const handleAdd = useCallback(() => {
    const newItem: CostHistory = {
      id: `history-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
      budget: currentBudget || 0,
      actualCost: currentActualCost || 0,
      costRatio: 0,
      note: '',
      manager: 'Admin'
    };
    
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    setEditingItem({ ...newItem });
    setEditingId(newItem.id);
    updateCurrentValues(updatedHistory);
  }, [currentBudget, currentActualCost, history, updateCurrentValues]);

  // 편집 시작
  const handleEditStart = useCallback((item: CostHistory) => {
    setEditingItem({ ...item });
      setEditingId(item.id);
  }, []);

  // 편집 저장
  const handleEditSave = useCallback(() => {
    try {
      if (!editingItem.date || editingItem.budget === undefined || editingItem.actualCost === undefined) {
        alert('날짜, 예산, 실제비용은 필수 항목입니다.');
        return;
      }

      const budget = safeNumber(editingItem.budget, 0);
      const actualCost = safeNumber(editingItem.actualCost, 0);
      
      if (budget < 0 || actualCost < 0) {
        alert('예산과 실제비용은 0 이상이어야 합니다.');
        return;
      }

      // 기존 항목 수정
      const updatedHistory = history.map(item => 
          item.id === editingId 
          ? {
              ...item,
              date: editingItem.date!,
              budget,
              actualCost,
              costRatio: calculateCostRatio(budget, actualCost),
              note: editingItem.note || ''
            }
            : item
      );

      setHistory(updatedHistory);
      setEditingId(null);
      setEditingItem({});
      updateCurrentValues(updatedHistory);
      
    } catch (error) {
      console.error('편집 저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  }, [editingItem, editingId, history, updateCurrentValues]);

  // 삭제
  const handleDelete = useCallback((id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      updateCurrentValues(updatedHistory);
    }
  }, [history, updateCurrentValues]);

  // 저장 및 닫기
  const handleSaveAndClose = useCallback(() => {
      onSave(history);
      onClose();
  }, [history, onSave, onClose]);

  // 최신 통계 계산
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    
    // 날짜순으로 정렬하여 최신 이력 찾기
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestHistory = sortedHistory[0];
    
    const latestRatio = calculateCostRatio(latestHistory.budget, latestHistory.actualCost);
    
    return {
      latestDate: latestHistory.date,
      latestBudget: latestHistory.budget,
      latestActualCost: latestHistory.actualCost,
      latestRatio,
      historyCount: history.length
    };
  }, [history, calculateCostRatio]);

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

                     {/* 최신 현황 정보 */}
           {stats && (
             <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-lg">
                   <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                     <DollarSign className="h-5 w-5 text-white" />
                </div>
                   <div>
                     <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                       최신 현황 ({stats.latestDate})
                     </span>
          </div>
                </CardTitle>
              </CardHeader>
               <CardContent className="pt-2">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
                     <div className="text-center">
                       <div className="text-3xl font-bold text-blue-600 mb-1">
                         {(stats.latestBudget / 100000000).toFixed(1)}억원
                       </div>
                       <div className="text-xs text-gray-500 mb-2">
                         {stats.latestBudget.toLocaleString()}원
                       </div>
                       <div className="text-sm font-medium text-blue-700">💰 예산</div>
                     </div>
                   </div>
                   <div className="bg-white p-4 rounded-xl shadow-md border border-orange-100">
                     <div className="text-center">
                       <div className="text-3xl font-bold text-orange-600 mb-1">
                         {(stats.latestActualCost / 100000000).toFixed(1)}억원
                       </div>
                       <div className="text-xs text-gray-500 mb-2">
                         {stats.latestActualCost.toLocaleString()}원
                       </div>
                       <div className="text-sm font-medium text-orange-700">💸 투입액</div>
                     </div>
                   </div>
                   <div className="bg-white p-4 rounded-xl shadow-md border border-green-100">
                     <div className="text-center">
                       <div className={`text-3xl font-bold mb-1 ${
                         stats.latestRatio > 100 ? 'text-red-600' :
                         stats.latestRatio >= 80 ? 'text-orange-600' :
                         stats.latestRatio >= 70 ? 'text-amber-600' : 'text-green-600'
                       }`}>
                         {stats.latestRatio.toFixed(1)}%
                  </div>
                       <div className="text-xs text-gray-500 mb-2">
                         잔여: {((stats.latestBudget - stats.latestActualCost) / 100000000).toFixed(1)}억원
                  </div>
                       <div className="text-sm font-medium text-green-700">📊 투입률</div>
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 투입액 추이 차트 */}
          {chartData.length > 0 && (
            <Card className="mb-6 shadow-lg border-0 bg-gradient-to-br from-slate-50 to-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    투입액 추이 분석
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  시간별 투입액 규모와 예산 기준선을 비교 분석합니다
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-96 bg-white rounded-xl p-4 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={chartData} 
                      margin={{ top: 30, right: 30, left: 30, bottom: 80 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid 
                        strokeDasharray="2 4" 
                        stroke="#e5e7eb" 
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="date" 
                        tick={{ 
                          fontSize: 12, 
                          fontWeight: 500,
                          fill: '#1f2937',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                        angle={0}
                        textAnchor="middle"
                        height={50}
                        axisLine={{ stroke: '#1f2937', strokeWidth: 2 }}
                        tickLine={{ stroke: '#1f2937', strokeWidth: 1 }}
                        interval="preserveStartEnd"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          const hasMultipleYears = chartData.length > 0 && chartData[0].hasMultipleYears;
                          
                          if (hasMultipleYears) {
                            return `${date.getFullYear().toString().slice(-2)}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
                          } else {
                            return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
                          }
                        }}
                      />
                      <YAxis 
                        orientation="left"
                        domain={[0, (dataMax) => {
                          // 기준선과 데이터 최대값을 고려하여 Y축 범위 설정
                          const maxValue = Math.max(dataMax, referenceLines.budget100);
                          return Math.ceil(maxValue * 1.1 * 10) / 10;
                        }]}
                        tick={{ 
                          fontSize: 12, 
                          fontWeight: 500,
                          fill: '#1f2937',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                        label={{
                          value: '투입액 (억원)',
                          angle: -90,
                          position: 'insideLeft',
                          style: {
                            textAnchor: 'middle',
                            fontSize: '14px',
                            fontWeight: 600,
                            fill: '#1f2937',
                            fontFamily: 'Inter, system-ui, sans-serif'
                          }
                        }}
                        axisLine={{ stroke: '#1f2937', strokeWidth: 2 }}
                        tickLine={{ stroke: '#1f2937', strokeWidth: 1 }}
                        tickFormatter={(value) => `${value}억`}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === '투입액') {
                            return [<span style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>{value}억원</span>, '투입액'];
                          } else if (name === '예산') {
                            return [<span style={{ fontWeight: 700, fontSize: '14px', color: '#3b82f6' }}>{value}억원</span>, '예산 (100%)'];
                          } else if (name === '예산70') {
                            return [<span style={{ fontWeight: 700, fontSize: '14px', color: '#f59e0b' }}>{value}억원</span>, '예산 (70%)'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(date) => {
                          const dateObj = new Date(date);
                          const hasMultipleYears = chartData.length > 0 && chartData[0].hasMultipleYears;
                          
                          let formattedDate;
                          if (hasMultipleYears) {
                            formattedDate = dateObj.toLocaleDateString('ko-KR', {
                              year: '2-digit',
                              month: '2-digit',
                              day: '2-digit'
                            });
                          } else {
                            formattedDate = dateObj.toLocaleDateString('ko-KR', {
                              month: '2-digit',
                              day: '2-digit'
                            });
                          }
                          
                          return <span style={{ fontWeight: 600, fontSize: '13px' }}>📅 {formattedDate}</span>;
                        }}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                          padding: '12px 16px',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          backdropFilter: 'blur(8px)'
                        }}
                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)', radius: 8 }}
                      />
                      
                      {/* 예산 기준선들 - 라벨 제거 */}
                      <ReferenceLine
                        y={referenceLines.budget100}
                        stroke="#3b82f6"
                        strokeDasharray="8 8"
                        strokeWidth={3}
                        opacity={0.8}
                      />
                      <ReferenceLine
                        y={referenceLines.budget70}
                        stroke="#f59e0b"
                        strokeDasharray="6 6"
                        strokeWidth={2}
                        opacity={0.7}
                      />
                      
                      <Legend 
                        verticalAlign="bottom"
                        height={60}
                        iconType="line"
                        wrapperStyle={{
                          paddingTop: '20px',
                          fontSize: '12px',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                        content={({ payload }) => (
                          <div className="flex justify-center items-center gap-6 pt-4">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed #3b82f6' }}></div>
                              <span className="text-sm text-blue-600 font-medium">예산 100%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-0.5 bg-amber-500" style={{ borderTop: '2px dashed #f59e0b' }}></div>
                              <span className="text-sm text-amber-600 font-medium">예산 70%</span>
                            </div>
                          </div>
                        )}
                      />
                      
                      <Bar 
                        dataKey="투입액" 
                        name="투입액"
                        radius={[8, 8, 4, 4]}
                        maxBarSize={60}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.barColor}
                            style={{
                              filter: `drop-shadow(0 4px 6px ${entry.barColor}40)`
                            }}
                          />
                        ))}
                      </Bar>

                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 이력 관리 - 모던 디자인 */}
          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-bold">투입률 이력 관리</span>
                    <div className="text-sm opacity-90 mt-1">
                      프로젝트 예산 및 비용 추적
                    </div>
                  </div>
                </CardTitle>
                <Button 
                  onClick={handleAdd} 
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  새 이력 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
                             {/* 빠른 통계 - 축소된 버전 */}
               {stats && (
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                   <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-3 rounded-lg shadow-md">
                     <div className="text-xl font-bold">{stats.historyCount}</div>
                     <div className="text-indigo-100 text-xs">총 이력</div>
                   </div>
                   <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow-md">
                     <div className="text-xl font-bold">{(stats.latestBudget / 100000000).toFixed(1)}억</div>
                     <div className="text-blue-100 text-xs">현재 예산</div>
                   </div>
                   <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-lg shadow-md">
                     <div className="text-xl font-bold">{(stats.latestActualCost / 100000000).toFixed(1)}억</div>
                     <div className="text-orange-100 text-xs">현재 투입액</div>
                   </div>
                   <div className={`text-white p-3 rounded-lg shadow-md ${
                     stats.latestRatio > 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                     stats.latestRatio >= 80 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                     stats.latestRatio >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                     'bg-gradient-to-r from-green-500 to-green-600'
                   }`}>
                     <div className="text-xl font-bold">{stats.latestRatio.toFixed(1)}%</div>
                     <div className="text-white/80 text-xs">현재 투입률</div>
                   </div>
                 </div>
               )}

                             {/* 테이블 - 동적 최적화 */}
               <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                                      <table className="w-full">
                     <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                       <tr>
                         <th className="text-left px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-20">
                           📅 날짜
                         </th>
                         <th className="text-right px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-24">
                           💰 예산
                         </th>
                         <th className="text-right px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-24">
                           💸 투입액
                         </th>
                         <th className="text-center px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-28">
                           📊 투입률
                         </th>
                         <th className="text-center px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-20">
                           🚦 상태
                         </th>
                         <th className="text-right px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-24">
                           💵 잔여
                         </th>
                         <th className="text-left px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-28">
                           📝 비고
                         </th>
                         <th className="text-center px-2 py-2.5 font-semibold text-gray-700 border-b-2 border-gray-200 text-sm w-16">
                           ⚙️
                         </th>
                    </tr>
                  </thead>
                  <tbody>
                      {[...history]
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((item, index) => {
                          const isEditing = editingId === item.id;
                      const ratioDisplay = getCostRatioDisplay(item.budget, item.actualCost);
                          const ratio = calculateCostRatio(item.budget, item.actualCost);
                          const remainingBudget = item.budget - item.actualCost;
                          
                      return (
                                                         <tr 
                               key={item.id} 
                               className={`border-b hover:bg-blue-50/30 transition-all duration-200 text-sm ${
                                 index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                               }`}
                             >
                               {isEditing ? (
                                 <>
                                                                      <td className="px-2 py-1.5">
                                <Input
                                  type="date"
                                  value={editingItem.date || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, date: e.target.value }))}
                                       className="border-2 border-blue-200 focus:border-blue-500 rounded-lg text-xs h-7 w-full"
                                />
                              </td>
                                   <td className="px-2 py-1.5">
                                <Input
                                  type="number"
                                  value={editingItem.budget || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, budget: Number(e.target.value) }))}
                                       className="border-2 border-blue-200 focus:border-blue-500 rounded-lg text-right text-xs h-7 w-full"
                                       placeholder="예산"
                                />
                              </td>
                                   <td className="px-2 py-1.5">
                                <Input
                                  type="number"
                                  value={editingItem.actualCost || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, actualCost: Number(e.target.value) }))}
                                       className="border-2 border-blue-200 focus:border-blue-500 rounded-lg text-right text-xs h-7 w-full"
                                       placeholder="투입액"
                                />
                              </td>
                                   <td className="px-2 py-1.5 text-center">
                                     {editingItem.budget && editingItem.actualCost ? (
                                       <span className="font-bold text-sm">
                                         {calculateCostRatio(editingItem.budget, editingItem.actualCost).toFixed(1)}%
                                       </span>
                                     ) : (
                                       <span className="text-gray-400 text-xs">-</span>
                                     )}
                                   </td>
                                   <td className="px-2 py-1.5 text-center">
                                     {editingItem.budget && editingItem.actualCost ? (
                                       <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getCostRatioDisplay(editingItem.budget, editingItem.actualCost).bgColor}`}>
                                         {getCostRatioDisplay(editingItem.budget, editingItem.actualCost).icon}
                                       </span>
                                     ) : (
                                       <span className="text-gray-400">-</span>
                                     )}
                                   </td>
                                   <td className="px-2 py-1.5 text-right">
                                     <span className={`font-medium text-xs ${
                                       editingItem.budget && editingItem.actualCost 
                                         ? (editingItem.budget - editingItem.actualCost >= 0 ? 'text-green-600' : 'text-red-600')
                                         : 'text-gray-400'
                                     }`}>
                                {editingItem.budget && editingItem.actualCost
                                         ? `${((editingItem.budget - editingItem.actualCost) / 100000000).toFixed(1)}억`
                                  : '-'
                                }
                                  </span>
                              </td>
                                   <td className="px-2 py-1.5">
                                <Input
                                       value={editingItem.note || ''}
                                       onChange={(e) => setEditingItem(prev => ({ ...prev, note: e.target.value }))}
                                       placeholder="비고..."
                                       className="border-2 border-blue-200 focus:border-blue-500 rounded-lg text-xs h-7 w-full"
                                />
                              </td>
                                   <td className="px-2 py-1.5">
                                     <div className="flex gap-1 justify-center">
                                       <Button 
                                         onClick={handleEditSave} 
                                         size="sm" 
                                         className="bg-green-600 hover:bg-green-700 text-white shadow-sm h-6 w-6 p-0"
                                       >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingItem({});
                                    }} 
                                    size="sm" 
                                    variant="outline"
                                         className="hover:bg-red-50 hover:border-red-300 h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                                                                      <td className="px-2 py-1.5">
                                     <div className="font-medium text-gray-900 text-xs">{item.date.slice(5)}</div>
                                   </td>
                                   <td className="px-2 py-1.5 text-right">
                                     <div className="font-bold text-blue-600 text-sm">
                                       {(item.budget / 100000000).toFixed(1)}억
                                     </div>
                                     <div className="text-xs text-gray-500">
                                       {(item.budget / 10000).toLocaleString()}만
                                     </div>
                                   </td>
                                   <td className="px-2 py-1.5 text-right">
                                     <div className="font-bold text-red-600 text-sm">
                                       {(item.actualCost / 100000000).toFixed(1)}억
                                     </div>
                                     <div className="text-xs text-gray-500">
                                       {(item.actualCost / 10000).toLocaleString()}만
                                     </div>
                                   </td>
                                   <td className="px-2 py-1.5">
                                     <div className="space-y-1">
                                       <div className={`text-lg font-bold text-center ${ratioDisplay.color}`}>
                                         {ratio.toFixed(1)}%
                                       </div>
                                       
                                       {/* 투입률 시각적 막대 - 축소 */}
                                       <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                                         <div 
                                           className={`h-2 rounded-full transition-all duration-500 shadow-sm ${
                                             ratio > 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                             ratio >= 80 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                             ratio >= 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                                             'bg-gradient-to-r from-green-400 to-green-500'
                                           }`}
                                           style={{ 
                                             width: `${Math.min(100, ratio)}%` 
                                           }}
                                         ></div>
                                       </div>
                                       
                                       <div className="text-center text-xs font-medium">
                                         {ratio > 100 ? '⚠️ 초과' : 
                                          ratio >= 80 ? '🔴 주의' :
                                          ratio >= 70 ? '🟡 관리' : '✅ 정상'}
                                       </div>
                                     </div>
                                   </td>
                                   <td className="px-2 py-1.5 text-center">
                                     <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold shadow-md ${ratioDisplay.bgColor} ${ratioDisplay.color}`}>
                                       <span className="text-sm">{ratioDisplay.icon}</span>
                                       <span className="hidden lg:inline text-xs">{ratioDisplay.status}</span>
                                </span>
                              </td>
                                   <td className="px-2 py-1.5 text-right">
                                     <div className={`font-bold text-sm ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                       {(remainingBudget / 100000000).toFixed(1)}억
                                     </div>
                                     <div className="text-xs text-gray-500">
                                       {(remainingBudget / 10000).toLocaleString()}만
                                     </div>
                                   </td>
                                   <td className="px-2 py-1.5">
                                     <div className="max-w-24">
                                       {item.note ? (
                                         <div className="bg-gray-100 p-1 rounded text-xs truncate" title={item.note}>
                                           {item.note}
                                         </div>
                                       ) : (
                                         <span className="text-gray-400 text-xs">-</span>
                                       )}
                                     </div>
                              </td>
                                   <td className="px-2 py-1.5">
                                     <div className="flex gap-1 justify-center">
                                  <Button 
                                    onClick={() => handleEditStart(item)} 
                                    size="sm" 
                                    variant="outline"
                                         className="hover:bg-blue-50 hover:border-blue-300 shadow-sm h-6 w-6 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    onClick={() => handleDelete(item.id)} 
                                    size="sm" 
                                    variant="outline"
                                         className="text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {history.length === 0 && (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50">
                      <div className="max-w-md mx-auto">
                        <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                          <Calendar className="h-12 w-12 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          아직 투입률 이력이 없습니다
                        </h3>
                        <p className="text-gray-600 mb-6">
                          "새 이력 추가" 버튼을 클릭하여 첫 번째 이력을 추가해보세요.
                        </p>
                        <Button 
                          onClick={handleAdd}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          첫 번째 이력 추가하기
                        </Button>
                      </div>
                  </div>
                )}
                </div>
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