
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
  
  // Etapa 1: Liberação Técnica Vital (QUALITY/ADMIN)
  releasedAt?: ISO8601Date;
  releasedBy?: string;

  // Etapa 2: Conferência Documental (CLIENT)
  documentalStatus?: QualityStatus;
  documentalNotes?: string;

  // Etapa 3: Conferência Física (CLIENT)
  physicalStatus?: QualityStatus;
  physicalNotes?: string;

  // Metadados de interação do cliente
  clientObservations?: string;
  viewedAt?: ISO8601Date;
  lastClientInteractionAt?: string;
  lastClientInteractionBy?: string;

  // Etapa 4: Mediação Técnica Vital (QUALITY/ADMIN)
  remediationReply?: string;
  remediatedAt?: ISO8601Date;
  remediatedBy?: string;

  // Etapa 5: Veredito Final do Parceiro (CLIENT)
  finalPartnerVerdict?: QualityStatus;
  finalVerdictAt?: ISO8601Date;

  // Global
  status: QualityStatus;
  chemicalComposition: ChemicalComposition;
  mechanicalProperties: MechanicalProperties;
  rejectionReason?: string;
  inspectedAt?: ISO8601Date;
  inspectedBy?: string;
}
