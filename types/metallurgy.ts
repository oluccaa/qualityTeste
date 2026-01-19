
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

export interface AuditStepRecord {
  step: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  timestamp?: ISO8601Date;
  performedBy?: string;
  notes?: string;
}

export interface SteelBatchMetadata {
  batchNumber: string;
  grade: string;
  invoiceNumber: string;
  
  // Custom Flags (Editáveis e persistentes)
  customFlags?: string[];
  
  // Controle de Fluxo
  currentStep: number;
  
  // Etapa 1: Liberação
  releasedAt?: ISO8601Date;
  releasedBy?: string;

  // Etapa 2: Auditoria Cliente
  documentalStatus?: QualityStatus;
  documentalFlags?: string[];
  physicalStatus?: QualityStatus;
  physicalFlags?: string[];
  clientObservations?: string;
  viewedAt?: ISO8601Date;

  // Etapa 3: Contestação
  isContested?: boolean;
  contestedAt?: ISO8601Date;
  contestedBy?: string;
  contestObservations?: string;

  // Etapa 4: Veredito Final
  finalClientVerdict?: QualityStatus;
  finalVerdictAt?: ISO8601Date;

  // Auditoria Técnica (Required for tracking document lifecycle)
  // Fix: Adding inspectedAt, inspectedBy and rejectionReason to satisfy domain model requirements
  inspectedAt?: ISO8601Date;
  inspectedBy?: string;
  rejectionReason?: string;

  // Global
  status: QualityStatus;
  chemicalComposition: ChemicalComposition;
  mechanicalProperties: MechanicalProperties;
}