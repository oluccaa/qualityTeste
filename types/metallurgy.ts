
import { ID, ISO8601Date } from './common.ts';
import { QualityStatus } from './enums.ts';

export interface ChemicalComposition {
  carbon: number;
  manganese: number;
  silicon: number;
  phosphorus: number;
  sulfur: number;
}

export interface MechanicalProperties {
  yieldStrength: number;
  tensileStrength: number;
  elongation: number;
}

export interface AuditSignature {
  userId: string;
  userName: string;
  userRole: string;
  timestamp: ISO8601Date;
  action: string;
  ip?: string;
}

export interface FileVersion {
  version: number;
  storagePath: string;
  createdAt: ISO8601Date;
  createdBy: string;
  note?: string;
}

export type AnnotationType = 'pencil' | 'marker' | 'rect' | 'circle' | 'eraser';

export interface NormalizedPoint {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
}

export interface AnnotationItem {
  id: string;
  type: AnnotationType;
  color: string;
  lineWidth: number;
  points?: NormalizedPoint[]; // Para pencil e marker
  startPoint?: NormalizedPoint; // Para shapes
  endPoint?: NormalizedPoint;   // Para shapes
  opacity?: number;
}

// Manifesto completo de anotações do documento
export type DocumentAnnotations = Record<number, AnnotationItem[]>;

export interface SteelBatchMetadata {
  batchNumber: string;
  grade: string;
  invoiceNumber: string;
  
  // Controle de Versão
  currentVersion: number;
  versionHistory: FileVersion[];
  
  // Controle de Fluxo
  currentStep: number; // 1 a 7

  // Propriedades de Rastreabilidade e Interação
  // Fix: Added missing viewedAt property to resolve error in InspectionSidebar.tsx
  viewedAt?: ISO8601Date;
  // Fix: Added missing clientObservations property to resolve errors in InspectionSidebar.tsx and QualityPortfolioView.tsx
  clientObservations?: string;
  // Fix: Added missing replacementFileId property to resolve error in useFilePreview.ts
  replacementFileId?: string;
  
  // Assinaturas de Etapas (Tracing Completo)
  signatures: {
    step1_release?: AuditSignature;
    step2_documental?: AuditSignature;
    step3_physical?: AuditSignature;
    step4_contestation?: AuditSignature;
    step5_mediation_review?: AuditSignature;
    step6_system_log?: AuditSignature;
    step7_final_verdict?: AuditSignature;
  };

  // Status de Etapas
  documentalStatus?: 'APPROVED' | 'REJECTED' | 'PENDING';
  physicalStatus?: 'APPROVED' | 'REJECTED' | 'PENDING';
  mediationStatus?: 'APPROVED' | 'REJECTED' | 'PENDING';

  // Conteúdo de Mediação
  analystContestationNote?: string;
  clientMediationNote?: string;

  // Etapa 2: Conferência Documental/Física
  documentalNotes?: string;
  documentalFlags?: string[];
  documentalDrawings?: string; 
  
  physicalNotes?: string;
  // Fix: Added missing physicalFlags property to resolve error in supabaseQualityService.ts
  physicalFlags?: string[];
  physicalPhotos?: string[];
  
  // Global
  status: QualityStatus;
  chemicalComposition: ChemicalComposition;
  mechanicalProperties: MechanicalProperties;
  rejectionReason?: string;
  inspectedAt?: ISO8601Date;
  inspectedBy?: string;
}
