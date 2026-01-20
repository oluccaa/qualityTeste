
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

export interface SteelBatchMetadata {
  batchNumber: string;
  grade: string;
  invoiceNumber: string;
  
  // Controle de Versão
  currentVersion: number;
  versionHistory: FileVersion[];
  
  // Controle de Fluxo
  currentStep: number;
  
  // Assinaturas de Etapas (Tracing Completo)
  signatures: {
    step1_release?: AuditSignature;
    step2_client_check?: AuditSignature;
    step3_remediation?: AuditSignature;
    step4_final_verdict?: AuditSignature;
  };

  // Etapa 2: Conferência Documental/Física
  documentalStatus?: QualityStatus;
  documentalNotes?: string;
  // Fix: added documentalFlags to support audit snapshots
  documentalFlags?: string[];
  // Fix: added documentalDrawings to support annotations
  documentalDrawings?: string;
  
  physicalStatus?: QualityStatus;
  physicalNotes?: string;
  // Fix: added physicalFlags to support audit snapshots
  physicalFlags?: string[];
  // Fix: added physicalPhotos to support evidence tracking
  physicalPhotos?: string[];
  
  // Tratamento de Rejeição
  remediationPlan?: string;
  remediationReply?: string;
  replacementFileId?: string; // Link para o novo arquivo se houver substituição

  // Interação e Rastreabilidade
  // Fix: added interaction fields for workflow and feedback tracking
  lastInteractionAt?: ISO8601Date;
  lastInteractionBy?: string;
  viewedAt?: ISO8601Date;
  clientObservations?: string;
  lastClientInteractionAt?: ISO8601Date;
  lastClientInteractionBy?: string;

  // Global
  status: QualityStatus;
  chemicalComposition: ChemicalComposition;
  mechanicalProperties: MechanicalProperties;
  rejectionReason?: string;
  inspectedAt?: ISO8601Date;
  inspectedBy?: string;
}
