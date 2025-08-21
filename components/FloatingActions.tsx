'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionsProps {
  onCreate: () => void;
  onOverview: () => void;
  onProjects: () => void;
}

export default function FloatingActions({ onCreate, onOverview, onProjects }: FloatingActionsProps) {
  return (
    <div className="floating-actions">
      <button 
        className="floating-action-btn secondary"
        onClick={onOverview}
        title="개요로 이동"
      >
        📊
      </button>
      <button 
        className="floating-action-btn secondary"
        onClick={onProjects}
        title="프로젝트 목록"
      >
        🌍
      </button>
      <button 
        className="floating-action-btn primary"
        onClick={onCreate}
        title="신규 프로젝트 생성"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}


