"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit3, Trash2, MapPin, Loader2, X, RefreshCw } from "lucide-react";
import { Project } from "@/lib/types";
import LocationManager from "@/components/LocationManager";

interface ProjectManagementProps {
  projects: Project[];
  onProjectUpdate: (updatedProjects: Project[]) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectAdd: (project: Project) => void;
}

export default function ProjectManagement({
  projects,
  onProjectUpdate,
  onProjectDelete,
  onProjectAdd
}: ProjectManagementProps) {
  const [selected, setSelected] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);
  const [pickOnMap, setPickOnMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setBusy(true);
    try {
      // 주소 검색 결과를 프로젝트에 반영
      if (addressSearch.trim()) {
        // 여기에 geocoding 로직 구현
        console.log("주소 검색:", addressSearch);
        // 실제 구현 시에는 주소를 좌표로 변환하여 lat, lng, city, country 업데이트
      }

      const updatedProjects = projects.map(p => 
        p.id === selected.id ? selected : p
      );
      onProjectUpdate(updatedProjects);
      setOpen(false);
      setSelected(null);
      setAddressSearch("");
    } catch (error) {
      console.error("프로젝트 업데이트 오류:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    if (selected) {
      onProjectDelete(selected.id);
      setOpen(false);
      setSelected(null);
    }
  };

  const handleAdd = () => {
    const newProject: Project = {
      id: `project_${Date.now()}`,
      pjtNo: `PJT-${Date.now()}`,
      name: "새 프로젝트",
      status: "계획",
      pm: "",
      salesManagers: [],
      designManagers: [],
      controlManagers: [],
      productionManagers: [],
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
    setOpen(true);
  };

  return (
    <>
      {/* 프로젝트 추가 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">프로젝트 관리</h2>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 프로젝트
        </Button>
      </div>

      {/* 프로젝트 편집 다이얼로그 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.id.startsWith('project_') ? '새 프로젝트 추가' : '프로젝트 편집'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">프로젝트명 *</Label>
                <Input
                  id="name"
                  value={selected?.name || ""}
                  onChange={(e) => setSelected(prev => prev ? {...prev, name: e.target.value} : null)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="status">상태</Label>
                <Select
                  value={selected?.status || "계획"}
                  onValueChange={(value) => setSelected(prev => prev ? {...prev, status: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="계획">계획</SelectItem>
                    <SelectItem value="진행 중">진행 중</SelectItem>
                    <SelectItem value="진행 중(관리필요)">진행 중(관리필요)</SelectItem>
                    <SelectItem value="일시 중단">일시 중단</SelectItem>
                    <SelectItem value="완료">완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pm">PM</Label>
                <Input
                  id="pm"
                  value={selected?.pm || ""}
                  onChange={(e) => setSelected(prev => prev ? {...prev, pm: e.target.value} : null)}
                  placeholder="프로젝트 매니저"
                />
              </div>
              
              <div>
                <Label htmlFor="salesManagers">영업 담당자</Label>
                <Input
                  id="salesManagers"
                  value={selected?.salesManagers?.join(", ") || ""}
                  onChange={(e) => {
                    const managers = e.target.value.split(',').map(m => m.trim()).filter(Boolean);
                    setSelected(prev => prev ? {...prev, salesManagers: managers} : null);
                  }}
                  placeholder="담당자1, 담당자2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="note">비고</Label>
              <Textarea
                id="note"
                value={selected?.note || ""}
                onChange={(e) => setSelected(prev => prev ? {...prev, note: e.target.value} : null)}
                rows={3}
                placeholder="프로젝트 관련 추가 정보..."
              />
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={selected?.startDate || ""}
                  onChange={(e) => setSelected(prev => prev ? {...prev, startDate: e.target.value} : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={selected?.endDate || ""}
                  onChange={(e) => setSelected(prev => prev ? {...prev, endDate: e.target.value} : null)}
                />
              </div>
            </div>

            {/* 위치 정보 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">주소</Label>
                <div className="flex gap-2 mb-4">
                  <Input
                    id="address"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    placeholder="주소를 입력하세요"
                  />
                  <Button
                    type="button"
                    onClick={() => setPickOnMap(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    지도에서 선택
                  </Button>
                </div>
                
                {/* 좌표 선택 지도 */}
                <LocationManager
                  lat={selected?.lat || 37.5665}
                  lng={selected?.lng || 126.9780}
                  onLocationChange={(lat, lng) => {
                    setSelected(prev => prev ? {...prev, lat, lng} : null);
                  }}
                />
              </div>
            </div>

            {/* 진행률 */}
            <div>
              <Label htmlFor="progress">진행률 (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={selected?.progress || 0}
                onChange={(e) => setSelected(prev => prev ? {...prev, progress: parseInt(e.target.value)} : null)}
              />
            </div>
          </form>

          <DialogFooter className="flex gap-2">
            {!selected?.id.startsWith('project_') && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            )}
            <Button onClick={() => setOpen(false)} variant="outline">
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={busy} className="flex items-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {selected?.id.startsWith('project_') ? '추가' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
