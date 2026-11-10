import { jsPDF } from 'jspdf';
import { DAY_KEYS, formatSchedule, getTreatmentEndDate } from './medications';
import { isLotExpiredAtApplication } from './vaccines';
import { isUpcomingConsultation } from './consultations';
import type {
  ConsultationRecord,
  MedicalPreferences,
  Medication,
  NotificationItem,
  TakenMed,
  VaccineRecord
} from '../types';

/**
 * Template "Clínico clássico" da ficha do paciente:
 * faixa azul no topo, títulos de seção sublinhados, tabelas com linhas
 * alternadas e rodapé com data de geração e paginação.
 */

type RGB = [number, number, number];

const COLORS: Record<string, RGB> = {
  primary: [29, 78, 216],
  primaryLight: [219, 234, 254],
  primaryDark: [30, 58, 138],
  zebra: [241, 245, 249],
  text: [31, 41, 55],
  muted: [100, 116, 139],
  border: [203, 213, 225],
  white: [255, 255, 255]
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CONTENT_BOTTOM = PAGE_H - 20;
const FOOTER_Y = PAGE_H - 10;

const FONT_SIZE = 9.5;
const CELL_PAD = 2;
const PT_TO_MM = 0.3528;
const LINE_H = FONT_SIZE * 1.15 * PT_TO_MM;

export interface ReportData {
  patientName: string;
  email: string;
  periodLabel: string;
  generatedAt: Date;
  /** Seções opcionais: quando `undefined`, a seção não entra no relatório. */
  medications?: Medication[];
  preferences?: MedicalPreferences;
  vaccines?: VaccineRecord[];
  consultations?: ConsultationRecord[];
  taken?: TakenMed[];
  notifications?: NotificationItem[];
}

interface Column {
  header: string;
  /** Fração da largura útil da página (a soma das colunas deve ser 1). */
  width: number;
}

function formatDateBR(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatDays(recurrence: string[] | undefined): string {
  if (!recurrence || recurrence.length === 0 || recurrence.length === DAY_KEYS.length) return 'Todos os dias';
  return DAY_KEYS.filter((d) => recurrence.includes(d))
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(', ');
}

function formatTreatment(med: Medication): string {
  const end = getTreatmentEndDate(med);
  if (end && med.startDate) return `${formatDateBR(med.startDate)} a ${formatDateBR(end)} (${med.treatmentDays} dias)`;
  return med.startDate ? `Contínuo, desde ${formatDateBR(med.startDate)}` : 'Contínuo';
}

class ClinicalReport {
  private doc = new jsPDF({ unit: 'mm', format: 'a4' });
  private y = 0;
  private generatedLabel: string;

  constructor(private data: ReportData) {
    this.generatedLabel = data.generatedAt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  build(): jsPDF {
    this.drawMainHeader();
    this.drawPersonalData();
    if (this.data.medications) this.drawMedications(this.data.medications);
    if (this.data.preferences) this.drawPreferences(this.data.preferences);
    if (this.data.vaccines) this.drawVaccines(this.data.vaccines);
    if (this.data.consultations) this.drawConsultations(this.data.consultations);
    if (this.data.taken) this.drawTaken(this.data.taken);
    if (this.data.notifications) this.drawNotifications(this.data.notifications);
    this.drawFooters();
    return this.doc;
  }

  // ---------- Estrutura da página ----------

  private drawMainHeader() {
    const { doc } = this;
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE_W, 30, 'F');

    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SENNEX', MARGIN, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primaryLight);
    doc.text('Ficha do paciente', MARGIN, 21);
    doc.text(`Período: ${this.data.periodLabel}`, MARGIN, 26);
    doc.text(`Gerado em ${this.generatedLabel}`, PAGE_W - MARGIN, 14, { align: 'right' });

    this.y = 40;
  }

  private drawContinuationHeader() {
    const { doc } = this;
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE_W, 12, 'F');

    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SENNEX', MARGIN, 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primaryLight);
    doc.text(`${this.data.patientName} · ${this.data.periodLabel}`, PAGE_W - MARGIN, 8, { align: 'right' });

    this.y = 22;
  }

  private newPage() {
    this.doc.addPage();
    this.drawContinuationHeader();
  }

  private ensureSpace(height: number) {
    if (this.y + height > CONTENT_BOTTOM) this.newPage();
  }

  private drawFooters() {
    const { doc } = this;
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      doc.setPage(page);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(`Gerado em ${this.generatedLabel}`, MARGIN, FOOTER_Y);
      doc.text(`Página ${page} de ${total}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
    }
  }

  // ---------- Blocos reutilizáveis ----------

  private sectionTitle(title: string) {
    const { doc } = this;
    this.ensureSpace(22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.text(title, MARGIN, this.y);
    this.y += 2;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 5;
  }

  private emptyText(text: string) {
    const { doc } = this;
    this.ensureSpace(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(FONT_SIZE);
    doc.setTextColor(...COLORS.muted);
    doc.text(text, MARGIN, this.y + 3);
    this.y += 11;
  }

  private table(columns: Column[], rows: string[][], options: { showHeader?: boolean; labelColumn?: boolean } = {}) {
    const { doc } = this;
    const { showHeader = true, labelColumn = false } = options;
    const widths = columns.map((c) => c.width * CONTENT_W);
    const baseline = CELL_PAD + FONT_SIZE * PT_TO_MM * 0.8;

    const drawHeader = () => {
      const height = 7;
      this.ensureSpace(height + LINE_H + CELL_PAD * 2);
      doc.setFillColor(...COLORS.primaryLight);
      doc.rect(MARGIN, this.y, CONTENT_W, height, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZE);
      doc.setTextColor(...COLORS.primaryDark);
      let x = MARGIN;
      columns.forEach((col, i) => {
        doc.text(col.header, x + CELL_PAD, this.y + 4.8);
        x += widths[i];
      });
      this.y += height;
    };

    if (showHeader) drawHeader();

    rows.forEach((row, rowIndex) => {
      doc.setFontSize(FONT_SIZE);
      const cells = row.map((value, i) => doc.splitTextToSize(value || '—', widths[i] - CELL_PAD * 2) as string[]);
      const height = Math.max(...cells.map((lines) => lines.length)) * LINE_H + CELL_PAD * 2;

      if (this.y + height > CONTENT_BOTTOM) {
        this.newPage();
        if (showHeader) drawHeader();
      }

      if (rowIndex % 2 === 1) {
        doc.setFillColor(...COLORS.zebra);
        doc.rect(MARGIN, this.y, CONTENT_W, height, 'F');
      }

      let x = MARGIN;
      cells.forEach((lines, i) => {
        const isLabel = labelColumn && i === 0;
        doc.setFont('helvetica', isLabel ? 'bold' : 'normal');
        doc.setTextColor(...(isLabel ? COLORS.muted : COLORS.text));
        doc.text(lines, x + CELL_PAD, this.y + baseline);
        x += widths[i];
      });

      this.y += height;
    });

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 9;
  }

  // ---------- Seções ----------

  private drawPersonalData() {
    this.sectionTitle('Dados pessoais');
    this.table(
      [
        { header: 'Campo', width: 0.25 },
        { header: 'Valor', width: 0.75 }
      ],
      [
        ['Nome', this.data.patientName],
        ['E-mail', this.data.email]
      ],
      { showHeader: false, labelColumn: true }
    );
  }

  private drawMedications(meds: Medication[]) {
    this.sectionTitle(`Medicamentos (${meds.length})`);
    if (meds.length === 0) return this.emptyText('Nenhum medicamento no período.');

    this.table(
      [
        { header: 'Nome', width: 0.19 },
        { header: 'Dosagem', width: 0.11 },
        { header: 'Tipo', width: 0.15 },
        { header: 'Horário', width: 0.25 },
        { header: 'Dias', width: 0.17 },
        { header: 'Tratamento', width: 0.13 }
      ],
      meds.map((med) => [
        med.name,
        med.dosage,
        med.type,
        formatSchedule(med),
        formatDays(med.recurrence),
        formatTreatment(med)
      ])
    );
  }

  private drawPreferences(prefs: MedicalPreferences) {
    this.sectionTitle('Preferências médicas');
    const { foodRestrictions, medicalRestrictions, allergies } = prefs;
    if (foodRestrictions.length === 0 && medicalRestrictions.length === 0 && allergies.length === 0) {
      return this.emptyText('Nenhuma preferência médica cadastrada.');
    }

    this.table(
      [
        { header: 'Categoria', width: 0.28 },
        { header: 'Itens', width: 0.72 }
      ],
      [
        ['Alergias', allergies.join(', ') || 'Nenhuma'],
        ['Restrições médicas', medicalRestrictions.join(', ') || 'Nenhuma'],
        ['Restrições alimentares', foodRestrictions.join(', ') || 'Nenhuma']
      ],
      { labelColumn: true }
    );
  }

  private drawVaccines(vaccines: VaccineRecord[]) {
    this.sectionTitle(`Cartão de vacina (${vaccines.length})`);
    if (vaccines.length === 0) return this.emptyText('Nenhuma vacina registrada.');

    this.table(
      [
        { header: 'Aplicação', width: 0.12 },
        { header: 'Vacina', width: 0.2 },
        { header: 'Dose', width: 0.13 },
        { header: 'Lote', width: 0.17 },
        { header: 'Local', width: 0.19 },
        { header: 'Reação adversa', width: 0.19 }
      ],
      vaccines.map((v) => [
        formatDateBR(v.applicationDate),
        [v.vaccine, v.manufacturer].filter(Boolean).join('\n'),
        v.dose,
        [
          v.lot,
          v.lotExpiry && `Val. ${formatDateBR(v.lotExpiry)}`,
          isLotExpiredAtApplication(v) && '(vencido na aplicação)'
        ]
          .filter(Boolean)
          .join('\n'),
        [v.place, [v.city, v.state].filter(Boolean).join('/')].filter(Boolean).join('\n'),
        v.adverseReaction || 'Nenhuma'
      ])
    );
  }

  private drawConsultations(consultations: ConsultationRecord[]) {
    this.sectionTitle(`Histórico de consultas (${consultations.length})`);
    if (consultations.length === 0) return this.emptyText('Nenhuma consulta no período.');

    const now = this.data.generatedAt;
    this.table(
      [
        { header: 'Data', width: 0.14 },
        { header: 'Horário', width: 0.11 },
        { header: 'Médico', width: 0.34 },
        { header: 'Especialidade', width: 0.26 },
        { header: 'Situação', width: 0.15 }
      ],
      consultations.map((c) => [
        formatDateBR(c.date),
        c.time,
        c.doctor,
        c.specialty,
        isUpcomingConsultation(c, now) ? 'Agendada' : 'Realizada'
      ])
    );
  }

  private drawTaken(taken: TakenMed[]) {
    this.sectionTitle(`Doses tomadas (${taken.length})`);
    if (taken.length === 0) return this.emptyText('Nenhuma dose registrada no período.');

    this.table(
      [
        { header: 'Data', width: 0.16 },
        { header: 'Tomado às', width: 0.14 },
        { header: 'Medicamento', width: 0.45 },
        { header: 'Dose prevista', width: 0.25 }
      ],
      taken.map((t) => [formatDateBR(t.date), t.time, t.medName, t.doseTime || '—'])
    );
  }

  private drawNotifications(notifications: NotificationItem[]) {
    this.sectionTitle(`Histórico de notificações (${notifications.length})`);
    if (notifications.length === 0) return this.emptyText('Nenhuma notificação no período.');

    this.table(
      [
        { header: 'Data e hora', width: 0.25 },
        { header: 'Mensagem', width: 0.75 }
      ],
      notifications.map((n) => [n.time, n.message])
    );
  }
}

export function buildPatientReport(data: ReportData): jsPDF {
  return new ClinicalReport(data).build();
}
