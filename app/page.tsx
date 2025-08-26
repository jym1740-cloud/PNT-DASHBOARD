"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';

// CSS는 app/globals.css에서 통합 관리

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { FileText, TrendingUp, AlertTriangle, Clock, DollarSign, Map, HelpCircle, Calendar, Plus, XCircle, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import ProjectTable from "@/components/ProjectTable";
import StatusOverview from "@/components/StatusOverview";
import DashboardHeader from "@/components/DashboardHeader";
import FloatingActions from "@/components/FloatingActions";
import EquipmentHistoryTable from "@/components/EquipmentHistoryTable";
import GanttChart from "@/components/GanttChart";
import LocationManager from "@/components/LocationManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

import { filterProjects, calculateStats } from "@/lib/projectUtils";
import { seedProjects } from "@/lib/sampleData";
import { Project, ProjectStatus } from "@/lib/types";
import CostHistoryManager from "@/components/CostHistoryManager";
import { parseNumberFromString } from "@/lib/utils";

// WorldMap을 동적 import로 변경 (SSR 비활성화)
const WorldMap = dynamic(() => import("@/components/WorldMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-600 font-medium">지도를 불러오는 중...</div>
      </div>
    </div>
  )
});

export default function CompanyOpsDashboard() {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState(seedProjects);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [equipmentHistory, setEquipmentHistory] = useState<any[]>([]);
  const [equipmentHistoryOpen, setEquipmentHistoryOpen] = useState(false);
  
  // 프로젝트 편집을 위한 상태
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  
  // 영업 담당자 입력을 위한 별도 상태
  const [salesManagersInput, setSalesManagersInput] = useState("");
  
  // 일정 관리를 위한 상태
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [people, setPeople] = useState<Array<{ id: string; name: string; affiliation: string; department: string }>>([]);
  const [managerStatuses, setManagerStatuses] = useState<Record<string, Record<string, string>>>({});

  // 투입률 이력 관리를 위한 상태
  const [costHistoryOpen, setCostHistoryOpen] = useState(false);
  const [selectedCostHistory, setSelectedCostHistory] = useState<any | null>(null);

  // 업데이트 시간 관리
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // 컴포넌트 마운트 확인
  useEffect(() => {
    setMounted(true);
    setLastUpdateTime(new Date());
  }, []);

  // 업데이트 시간 갱신 함수
  const updateLastUpdateTime = useCallback(() => {
    setLastUpdateTime(new Date());
  }, []);

  // 프로젝트 편집 핸들러
  function onEdit(p: any) {
    setSelected({ ...p });
    setSalesManagersInput(p.salesManagers?.join(", ") || "");
    setEquipmentHistory(p.equipmentHistory || []);
    setOpen(true);
    updateLastUpdateTime();
  }

  // 일정 관리 핸들러
  function onSchedule(p: any) {
    setSelectedSchedule({ ...p });
    setScheduleItems(p.scheduleItems || []);
    // 초기 인원 목록 구성: 저장된 people만 사용, 기본 인원 생성 안함
    const initialPeople: Array<{ id: string; name: string; affiliation: string; department: string }> = (p.people && Array.isArray(p.people))
      ? p.people
      : [];
    setPeople(initialPeople);
    setScheduleOpen(true);
    updateLastUpdateTime();
  }

  // 장비 이력 핸들러
  function onEquipmentHistory(p: any) {
    setSelected({ ...p });
    setEquipmentHistory(p.equipmentHistory || []);
    setEquipmentHistoryOpen(true);
    updateLastUpdateTime();
  }

  // 투입률 이력 관리 핸들러
  function onCostHistory(p: any) {
    setSelectedCostHistory({ ...p });
    setCostHistoryOpen(true);
    updateLastUpdateTime();
  }

  // 신규 프로젝트 생성 핸들러
  function onCreate() {
    const newProject = {
      id: `project_${Date.now()}`,
      pjtNo: `PJT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`,
      name: "",
      status: "계획",
      pm: "",
      salesManagers: [], // 배열로 수정
      techManager: "",
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: "",
      lat: 37.5665,
      lng: 126.9780,
      country: "Korea",
      city: "Seoul",
      address: "",
      equipmentHistory: [],
      scheduleItems: [],
      people: [],
      costHistory: []
    };
    setSelected(newProject);
    setSalesManagersInput(""); // 별도 상태 초기화
    setEquipmentHistory([]); // equipmentHistory 상태도 초기화
    setOpen(true);
    updateLastUpdateTime();
  }

  // 투입률 이력 저장 핸들러
  const onCostHistorySave = useCallback((history: any[]) => {
    if (selectedCostHistory) {
      console.log('투입률 이력 저장 시작:', history);
      console.log('현재 선택된 프로젝트:', selectedCostHistory);

      // 가장 최근 이력을 기준으로 프로젝트의 예산과 실제비용 업데이트
      let updatedProject = { ...selectedCostHistory, costHistory: history };

      if (history.length > 0) {
        const latestHistory = history[history.length - 1];
        const latestCostRatio = (latestHistory.actualCost / latestHistory.budget) * 100;
        
        updatedProject = {
          ...updatedProject,
          budget: latestHistory.budget,
          actualCost: latestHistory.actualCost
        };

        // 투입률에 따른 상태 자동 업데이트
        let newStatus = selectedCostHistory.status;
        
        if (latestCostRatio >= 95) {
          newStatus = "진행 중(관리필요)";
        } else if (latestCostRatio >= 80) {
          newStatus = "진행 중(관리필요)";
        } else if (latestCostRatio >= 70) {
          newStatus = "진행 중";
        } else if (latestCostRatio > 0) {
          newStatus = "진행 중";
        } else {
          newStatus = "계획";
        }

        updatedProject.status = newStatus;
        
        console.log('투입률 기반 상태 업데이트:', {
          costRatio: latestCostRatio,
          oldStatus: selectedCostHistory.status,
          newStatus: newStatus
        });
        
        console.log('최신 이력 기반으로 프로젝트 업데이트:', latestHistory);
      }

      console.log('업데이트될 프로젝트:', updatedProject);

      setProjects((prev) => {
        const newProjects = prev.map((p) =>
          p.id === selectedCostHistory.id ? updatedProject : p
        );
        console.log('새로운 프로젝트 배열:', newProjects);
        return newProjects;
      });

      // selectedCostHistory도 업데이트하여 최신 상태 유지
      setSelectedCostHistory(updatedProject);

      console.log('투입률 이력 저장 완료');
      updateLastUpdateTime();
    } else {
      console.error('선택된 프로젝트가 없습니다.');
    }
  }, [selectedCostHistory, updateLastUpdateTime]);

  // 프로젝트 삭제 핸들러
  function onDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    updateLastUpdateTime();
  }

  // 프로젝트 저장 핸들러
  function onSave() {
    // 투입률 계산 및 상태 자동 변경
    let updatedProject = { ...selected, equipmentHistory };
    
    // 신규 프로젝트인지 확인
    const isNewProject = !projects.some(p => p.id === selected.id);
    
    if (isNewProject) {
      // 신규 프로젝트: 배열 맨 앞에 추가
      setProjects(prev => [updatedProject, ...prev]);
    } else {
      // 기존 프로젝트: 업데이트
      setProjects(prev => prev.map(p => p.id === selected.id ? updatedProject : p));
    }
    
    setOpen(false);
    setSelected(null);
    setEquipmentHistory([]);
    updateLastUpdateTime();
  }

  // 일정 저장 핸들러
  function saveSchedule() {
    if (selectedSchedule) {
      const updatedProject = { ...selectedSchedule, scheduleItems, people };
      setProjects((prev) => 
        prev.map((p) => (p.id === selectedSchedule.id ? updatedProject : p))
      );
      setScheduleOpen(false);
      updateLastUpdateTime();
    }
  }

  // 일정 항목 추가
  function addScheduleItem() {
    const newItem = {
      id: Math.random().toString(36).slice(2),
      name: "새 일정",
      startDate: "",
      endDate: "",
      progress: 0
    };
    setScheduleItems(prev => [...prev, newItem]);
    updateLastUpdateTime();
  }

  // 일정 항목 업데이트
  function updateScheduleItem(id: string, field: string, value: any) {
    setScheduleItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    updateLastUpdateTime();
  }

  // 일정 항목 삭제
  function deleteScheduleItem(id: string) {
    setScheduleItems(prev => prev.filter(item => item.id !== id));
    updateLastUpdateTime();
  }

  // 인원 추가
  function addPerson() {
    const newPerson = {
      id: Math.random().toString(36).slice(2),
      name: "",
      affiliation: "",
      department: ""
    };
    setPeople(prev => [...prev, newPerson]);
    updateLastUpdateTime();
  }

  // 인원 업데이트
  function updatePerson(index: number, field: string, value: string) {
    setPeople(prev => 
      prev.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    );
    updateLastUpdateTime();
  }

  // 인원 삭제
  function deletePerson(index: number) {
    setPeople(prev => prev.filter((_, i) => i !== index));
    updateLastUpdateTime();
  }

  // 달력 열기
  function onCalendarOpen(person: any) {
    alert(`${person.name}의 달력이 열립니다.`);
  }

  // 인원 상태 업데이트
  function onStatusUpdate(managerId: string, dateKey: string, status: string) {
    setManagerStatuses(prev => ({
      ...prev,
      [managerId]: {
        ...prev[managerId],
        [dateKey]: status
      }
    }));
    updateLastUpdateTime();
  }

  // 필터링된 프로젝트
  const filteredProjects = useMemo(() => filterProjects(projects, query, statusFilter), [projects, query, statusFilter]);
  
  // 통계 데이터
  const statsData = useMemo(() => calculateStats(projects), [projects]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <DashboardHeader 
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={onCreate}
        onHelpOpen={() => {}}
        lastUpdateTime={lastUpdateTime}
        onManualUpdate={updateLastUpdateTime}
      />

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* 월드맵 */}
        <WorldMap projects={filteredProjects} />

        {/* 상태별 현황 - 수직 배열 최적화 */}
        {/* 상태별 현황 */}
        <StatusOverview projects={projects} />

        {/* 프로젝트 리스트 */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ProjectTable
              projects={filteredProjects}
              onEdit={onEdit}
              onSchedule={onSchedule}
              onEquipmentHistory={onEquipmentHistory}
              onCostHistory={onCostHistory}
              onDelete={onDelete}
            />
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Buttons */}
      <FloatingActions
        onCreate={onCreate}
        onOverview={() => {}}
        onProjects={() => {}}
      />

      {/* Editor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.pjtNo ? "프로젝트 수정" : "신규 프로젝트"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pr-2 pb-4">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                기본 정보
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>PJT NO</Label>
                  <Input value={selected?.pjtNo ?? ""} onChange={(e) => setSelected((s: any) => ({ ...s, pjtNo: e.target.value }))} placeholder="예: PJT-25001" />
                </div>
                <div>
                  <Label>프로젝트명</Label>
                  <Input value={selected?.name ?? ""} onChange={(e) => setSelected((s: any) => ({ ...s, name: e.target.value }))} placeholder="예: Dryer Retrofit" />
                </div>
                <div>
                  <Label>상태</Label>
                  <Select value={selected?.status ?? "계획"} onValueChange={(v) => setSelected((s: any) => ({ ...s, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="계획">계획</SelectItem>
                      <SelectItem value="진행 중">진행 중</SelectItem>
                      <SelectItem value="진행 중(관리필요)">진행 중<br/>(관리필요)</SelectItem>
                      <SelectItem value="일시 중단">일시 중단</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 담당자 정보 섹션 */}
            <div className="border-t pt-4 space-y-4">
              <div className="text-sm font-medium text-medium text-zinc-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                담당자 정보
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>PM</Label>
                  <Input value={selected?.pm ?? ""} onChange={(e) => setSelected((s: any) => ({ ...s, pm: e.target.value }))} placeholder="프로젝트 매니저" />
                </div>
                <div></div>
                <div>
                  <Label>영업 담당자</Label>
                  <Input 
                    value={salesManagersInput}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      console.log('영업 담당자 입력:', inputValue);
                      setSalesManagersInput(inputValue);
                      
                      // 쉼표로 구분하여 배열로 변환
                      const managers = inputValue.split(',').map(m => m.trim()).filter(Boolean);
                      console.log('변환된 배열:', managers);
                      
                      setSelected((s: any) => ({ ...s, salesManagers: managers }));
                    }} 
                    placeholder="담당자1, 담당자2" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    쉼표(,)로 구분하여 여러 담당자를 입력할 수 있습니다
                  </p>
                </div>
                <div>
                  <Label>기술 담당자</Label>
                  <Input value={selected?.techManager ?? ""} onChange={(e) => setSelected((s: any) => ({ ...s, techManager: e.target.value }))} placeholder="기술 담당자" />
                </div>
              </div>
            </div>

            {/* 비고 섹션 */}
            <div className="border-t pt-4 space-y-4">
              <div className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                추가 정보
              </div>
              <div>
                <Label>비고</Label>
                <Textarea value={selected?.note ?? ""} onChange={(e) => setSelected((s: any) => ({ ...s, note: e.target.value }))} placeholder="메모" />
              </div>
            </div>

            {/* 위치 정보 섹션 */}
            <div className="border-t pt-4 space-y-4">
              <div className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                위치 정보
              </div>
              <LocationManager
                lat={selected?.lat}
                lng={selected?.lng}
                onLocationChange={(lat, lng) => setSelected((s: any) => ({ ...s, lat, lng }))}
              />
            </div>

            {/* 비용 정보 섹션 */}
            <div className="border-t pt-4 space-y-4">
              <div className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full">
                </div>
                비용 정보
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>예산 (KRW)</Label>
                  <Input 
                    type="text" 
                    value={selected?.budget ? selected.budget.toLocaleString() : '0'} 
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const numericValue = parseNumberFromString(rawValue);
                      if (!isNaN(numericValue)) {
                        setSelected((s: any) => ({ ...s, budget: numericValue }));
                      }
                    }} 
                    placeholder="예: 1,000,000"
                  />
                </div>
                <div>
                  <Label>투입원가 (KRW)</Label>
                  <Input 
                    type="text" 
                    value={selected?.actualCost ? selected.actualCost.toLocaleString() : '0'} 
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const numericValue = parseNumberFromString(rawValue);
                      if (!isNaN(numericValue)) {
                        setSelected((s: any) => ({ ...s, actualCost: numericValue }));
                      }
                    }} 
                    placeholder="실제 지출된 비용 (예: 1,000,000)" 
                  />
                  {selected?.budget > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ 투입률이 70%를 넘으면 상태가 자동으로 "진행 중(관리필요)"로 변경됩니다
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button onClick={() => setOpen(false)} variant="ghost"><XCircle className="h-4 w-4 mr-1"/>취소</Button>
              <Button onClick={onSave}><CheckCircle2 className="h-4 w-4 mr-1"/>저장</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 설비이력 관리 모달 */}
      <Dialog open={equipmentHistoryOpen} onOpenChange={setEquipmentHistoryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              설비이력 관리 - {selected?.name || "프로젝트"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 이력 추가 버튼 */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                총 <span className="font-semibold text-purple-600">{equipmentHistory.length}</span>건의 이력이 있습니다.
              </div>
              <Button 
                onClick={() => {
                  const newHistory = {
                    id: Math.random().toString(36).slice(2),
                    date: new Date().toISOString().split('T')[0],
                    description: "",
                    cost: 0
                  };
                  setEquipmentHistory(prev => [...prev, newHistory]);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 이력 추가
              </Button>
            </div>

            {/* 설비이력 테이블 */}
            <EquipmentHistoryTable
              equipmentHistory={equipmentHistory}
              onUpdate={(id: string, field: string, value: any) => {
                setEquipmentHistory(prev => 
                  prev.map(item => 
                    item.id === id ? { ...item, [field]: value } : item
                  )
                );
              }}
              onDelete={(id: string) => {
                setEquipmentHistory(prev => prev.filter(item => item.id !== id));
                updateLastUpdateTime();
              }}
            />
          </div>

          <DialogFooter>
            <Button onClick={() => setEquipmentHistoryOpen(false)} variant="outline">
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일정 및 인원투입 관리 모달 */}
      <Dialog open={scheduleOpen} onOpenChange={(open) => {
        if (!open && scheduleItems.length > 0) {
          // 모달을 닫으려고 할 때 저장 확인
          const shouldSave = confirm('저장하지 않은 변경사항이 있습니다. 저장하시겠습니까?');
          if (shouldSave) {
            saveSchedule();
          }
        }
        setScheduleOpen(open);
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              일정 및 인원투입 관리 - {selectedSchedule?.name || "프로젝트"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 프로젝트 기본 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">프로젝트 번호:</span>
                  <span className="ml-2 text-gray-600">{selectedSchedule?.pjtNo}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">상태:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {selectedSchedule?.status || "상태 없음"}
                  </span>
                </div>
              </div>
            </div>

            {/* GanttChart 컴포넌트 사용 */}
            <GanttChart
              projects={[selectedSchedule].filter(Boolean)}
              scheduleItems={scheduleItems}
              people={people}
              managerStatuses={managerStatuses}
              onScheduleItemUpdate={updateScheduleItem}
              onScheduleItemDelete={deleteScheduleItem}
              onScheduleItemAdd={addScheduleItem}
              onPersonUpdate={updatePerson}
              onPersonAdd={addPerson}
              onPersonDelete={deletePerson}
              onCalendarOpen={onCalendarOpen}
              onSave={saveSchedule}
              onStatusUpdate={onStatusUpdate}
            />
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button onClick={() => setScheduleOpen(false)} variant="ghost">
                <XCircle className="h-4 w-4 mr-1"/>취소
              </Button>
              <Button onClick={saveSchedule}>
                <CheckCircle2 className="h-4 w-4 mr-1"/>저장
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 투입률 이력 관리 모달 */}
      {costHistoryOpen && selectedCostHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {(() => {
            // 디버깅을 위한 값 계산
            let calculatedBudget = 0;
            let calculatedActualCost = 0;
            
            if (selectedCostHistory.costHistory && selectedCostHistory.costHistory.length > 0) {
              // 테이블 표시 순서와 일치하도록 첫 번째 항목을 최신 이력으로 사용
              const latestHistory = selectedCostHistory.costHistory[0];
              
              calculatedBudget = latestHistory.budget;
              calculatedActualCost = latestHistory.actualCost;
              
              console.log('투입률 이력 모달 열기 - 최신 이력 데이터 (테이블 표시 순서 기준):', {
                projectName: selectedCostHistory.name,
                costHistoryLength: selectedCostHistory.costHistory.length,
                latestHistory: latestHistory,
                arrayIndex: 0,
                calculatedBudget: calculatedBudget,
                calculatedActualCost: calculatedActualCost
              });
            } else {
              calculatedBudget = selectedCostHistory.budget || 0;
              calculatedActualCost = selectedCostHistory.actualCost || 0;
              
              console.log('투입률 이력 모달 열기 - 이력 없음, 프로젝트 기본값 사용:', {
                projectName: selectedCostHistory.name,
                projectBudget: selectedCostHistory.budget,
                projectActualCost: selectedCostHistory.actualCost,
                calculatedBudget: calculatedBudget,
                calculatedActualCost: calculatedActualCost
              });
            }
            
            return (
              <CostHistoryManager
                projectId={selectedCostHistory.id}
                projectName={selectedCostHistory.name}
                currentBudget={calculatedBudget}
                currentActualCost={calculatedActualCost}
                costHistory={selectedCostHistory.costHistory || []}
                onSave={onCostHistorySave}
                onClose={() => {
                  setCostHistoryOpen(false);
                  setSelectedCostHistory(null);
                  console.log('투입률 이력 모달 닫힘');
                }}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}