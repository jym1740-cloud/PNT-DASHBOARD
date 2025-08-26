'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Edit, Trash2, Save, X, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CostHistory, Project } from '@/lib/types';
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

  // 투입률 상태에 따른 색상 및 아이콘
  const getCostRatioDisplay = useCallback((budget: number, actualCost: number) => {
    const ratio = calculateCostRatio(budget, actualCost);
    
    if (ratio >= 95) {
      return { color: 'text-red-600', bgColor: 'bg-red-50', icon: '🔴', status: '위험' };
    } else if (ratio >= 80) {
      return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: '🟠', status: '주의' };
    } else if (ratio >= 70) {
      return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: '🟡', status: '관리필요' };
    } else if (ratio > 0) {
      return { color: 'text-green-600', bgColor: 'bg-green-50', icon: '🟢', status: '정상' };
    } else {
      return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: '⚪', status: '계획' };
    }
  }, [calculateCostRatio]);

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

  // 통계 계산
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    
    const totalBudget = history.reduce((sum, item) => sum + item.budget, 0);
    const totalActualCost = history.reduce((sum, item) => sum + item.actualCost, 0);
    const avgCostRatio = totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0;
    
    return {
      totalBudget,
      totalActualCost,
      avgCostRatio,
      historyCount: history.length
    };
  }, [history]);

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

          {/* 통계 요약 */}
          {stats && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  이력 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.historyCount}</div>
                    <div className="text-sm text-gray-500">총 이력 수</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{(stats.totalBudget / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-gray-500">총 예산</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{(stats.totalActualCost / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-gray-500">총 실제비용</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{stats.avgCostRatio.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">평균 투입률</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">날짜</th>
                      <th className="text-left p-3 font-semibold">예산</th>
                      <th className="text-left p-3 font-semibold">실제 비용</th>
                      <th className="text-left p-3 font-semibold">투입률</th>
                      <th className="text-left p-3 font-semibold">상태</th>
                      <th className="text-left p-3 font-semibold">비고</th>
                      <th className="text-left p-3 font-semibold">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => {
                      const ratioDisplay = getCostRatioDisplay(item.budget, item.actualCost);
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          {editingId === item.id ? (
                            <>
                              <td className="p-3">
                                <Input
                                  type="date"
                                  value={editingItem.date || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, date: e.target.value }))}
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={editingItem.budget || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, budget: Number(e.target.value) }))}
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={editingItem.actualCost || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, actualCost: Number(e.target.value) }))}
                                />
                              </td>
                              <td className="p-3">
                                {editingItem.budget && editingItem.actualCost
                                  ? `${calculateCostRatio(editingItem.budget, editingItem.actualCost).toFixed(1)}%`
                                  : '-'
                                }
                              </td>
                              <td className="p-3">
                                {editingItem.budget && editingItem.actualCost ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCostRatioDisplay(editingItem.budget, editingItem.actualCost).bgColor}`}>
                                    {getCostRatioDisplay(editingItem.budget, editingItem.actualCost).icon}
                                    {getCostRatioDisplay(editingItem.budget, editingItem.actualCost).status}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="p-3">
                                <Input
                                  value={editingItem.description || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="비고"
                                />
                              </td>
                              <td className="p-3">
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
                              <td className="p-3 font-medium">{item.date}</td>
                              <td className="p-3">{item.budget.toLocaleString()}원</td>
                              <td className="p-3">{item.actualCost.toLocaleString()}원</td>
                              <td className="p-3">
                                <span className={`font-bold ${ratioDisplay.color}`}>
                                  {calculateCostRatio(item.budget, item.actualCost).toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ratioDisplay.bgColor}`}>
                                  {ratioDisplay.icon}
                                  {ratioDisplay.status}
                                </span>
                              </td>
                              <td className="p-3">{item.description || '-'}</td>
                              <td className="p-3">
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
                      );
                    })}
                  </tbody>
                </table>
                
                {history.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>아직 투입률 이력이 없습니다.</p>
                    <p className="text-sm">"이력 추가" 버튼을 클릭하여 첫 번째 이력을 추가해보세요.</p>
                  </div>
                )}
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