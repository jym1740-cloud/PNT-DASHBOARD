'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

interface MultiManagerInputProps {
  label: string;
  managers: string[];
  onManagersChange: (managers: string[]) => void;
}

export default function MultiManagerInput({ 
  label, 
  managers, 
  onManagersChange 
}: MultiManagerInputProps) {
  const [newManager, setNewManager] = useState("");

  const addManager = () => {
    if (newManager.trim() && !managers.includes(newManager.trim())) {
      onManagersChange([...managers, newManager.trim()]);
      setNewManager("");
    }
  };

  const removeManager = (index: number) => {
    onManagersChange(managers.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addManager();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-zinc-500">{managers.length}명</span>
      </div>
      
      {/* 담당자 목록 표시 */}
      {managers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="text-xs text-zinc-600 font-medium mb-2">현재 담당자</div>
          {managers.map((manager, index) => (
            <div key={index} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border">
              <span className="text-sm">{manager}</span>
              <button
                type="button"
                onClick={() => removeManager(index)}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                title="담당자 제거"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 새 담당자 추가 */}
      <div className="space-y-2">
        <div className="text-xs text-zinc-600 font-medium">새 담당자 추가</div>
        <div className="flex gap-2">
          <Input
            value={newManager}
            onChange={(e) => setNewManager(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="담당자 이름 입력"
            className="flex-1 text-sm"
          />
          <Button 
            type="button" 
            onClick={addManager} 
            size="sm" 
            variant="outline"
            disabled={!newManager.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </Button>
        </div>
        <div className="text-xs text-zinc-500">
          Enter 키를 누르거나 추가 버튼을 클릭하세요
        </div>
      </div>
    </div>
  );
}
