import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download, FileText, User, Pill, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';

export const PDFGenerator: React.FC = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);

  const generatePDF = () => {
    setGenerating(true);

    const fichas = JSON.parse(localStorage.getItem('sennex_fichas') || '[]');
    const userFicha = fichas.find((f: any) => f.userId === user?.id);

    const medications = JSON.parse(localStorage.getItem('sennex_medications') || '[]');
    const userMedications = medications.filter((m: any) => m.userId === user?.id);

    const preferences = JSON.parse(localStorage.getItem('sennex_medical_preferences') || '{}');
    const userPreferences = preferences[user?.id || ''];

    const notifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
    const userNotifications = notifications.filter((n: any) => n.userId === user?.id);

    if (!userFicha && userMedications.length === 0) {
      setGenerating(false);
      toast.error('Não há dados para gerar o PDF');
      return;
    }

    setTimeout(() => {
      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(20);
      doc.text('SENNEX - FICHA DO PACIENTE', 105, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('DADOS PESSOAIS', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.text(`Nome: ${userFicha?.name || ''} ${userFicha?.surname || ''}`, 20, yPos);
      yPos += 7;
      doc.text(`E-mail: ${userFicha?.email || ''}`, 20, yPos);
      yPos += 15;

      doc.setFontSize(14);
      doc.text(`MEDICAMENTOS (${userMedications.length})`, 20, yPos);
      yPos += 10;

      if (userMedications.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text('Nenhum medicamento cadastrado', 20, yPos);
        yPos += 10;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(0);
        userMedications.forEach((med: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${index + 1}. ${med.name}`, 20, yPos);
          yPos += 7;
          doc.text(`   Dosagem: ${med.dosage} | Tipo: ${med.type} | Horário: ${med.time}`, 20, yPos);
          yPos += 7;
          if (med.startDate) {
            const startDate = new Date(med.startDate + 'T00:00:00').toLocaleDateString('pt-BR');
            doc.text(`   Início do Tratamento: ${startDate}`, 20, yPos);
            yPos += 7;
          }
          if (med.recurrence && med.recurrence.length > 0) {
            doc.text(`   Dias: ${med.recurrence.join(', ').toUpperCase()}`, 20, yPos);
            yPos += 7;
          }
          yPos += 3;
        });
      }

      yPos += 5;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('PREFERÊNCIAS MÉDICAS', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      const foodRestrictions = Array.isArray(userPreferences?.foodRestrictions)
        ? userPreferences.foodRestrictions
        : (userPreferences?.foodRestrictions ? [userPreferences.foodRestrictions] : []);

      const medicalRestrictions = Array.isArray(userPreferences?.medicalRestrictions)
        ? userPreferences.medicalRestrictions
        : (userPreferences?.medicalRestrictions ? [userPreferences.medicalRestrictions] : []);

      const allergies = Array.isArray(userPreferences?.allergies)
        ? userPreferences.allergies
        : (userPreferences?.allergies ? [userPreferences.allergies] : []);

      if (foodRestrictions.length > 0) {
        doc.text('Restrições Alimentares:', 20, yPos);
        yPos += 7;
        foodRestrictions.forEach((item: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`- ${item}`, 20, yPos);
          yPos += 7;
        });
        yPos += 3;
      }

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      if (medicalRestrictions.length > 0) {
        doc.text('Restrições Médicas:', 20, yPos);
        yPos += 7;
        medicalRestrictions.forEach((item: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`- ${item}`, 20, yPos);
          yPos += 7;
        });
        yPos += 3;
      }

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      if (allergies.length > 0) {
        doc.text('Alergias:', 20, yPos);
        yPos += 7;
        allergies.forEach((item: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`- ${item}`, 20, yPos);
          yPos += 7;
        });
        yPos += 3;
      }

      if (foodRestrictions.length === 0 && medicalRestrictions.length === 0 && allergies.length === 0) {
        doc.setTextColor(100);
        doc.text('Nenhuma preferência médica cadastrada', 20, yPos);
        yPos += 10;
        doc.setTextColor(0);
      }

      yPos += 5;

      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text(`HISTÓRICO RECENTE (${userNotifications.length} notificações)`, 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      if (userNotifications.length === 0) {
        doc.setTextColor(100);
        doc.text('Nenhuma notificação registrada', 20, yPos);
      } else {
        const recentNotifications = userNotifications.slice(0, 5);
        recentNotifications.forEach((notif: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setTextColor(0);
          doc.text(`${index + 1}. ${notif.message}`, 20, yPos);
          yPos += 7;
          doc.setTextColor(100);
          doc.text(`   ${notif.time}`, 20, yPos);
          doc.setTextColor(0);
          yPos += 10;
        });
      }

      const fileName = `ficha-paciente-${user?.name?.replace(/\s+/g, '-') || 'sennex'}.pdf`;
      doc.save(fileName);

      setGenerating(false);
      toast.success('PDF gerado com sucesso');
    }, 1500);
  };

  const fichas = JSON.parse(localStorage.getItem('sennex_fichas') || '[]');
  const userFicha = fichas.find((f: any) => f.userId === user?.id);

  const medications = JSON.parse(localStorage.getItem('sennex_medications') || '[]');
  const userMedications = medications.filter((m: any) => m.userId === user?.id);

  const preferences = JSON.parse(localStorage.getItem('sennex_medical_preferences') || '{}');
  const userPreferences = preferences[user?.id || ''];

  const notifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
  const userNotifications = notifications.filter((n: any) => n.userId === user?.id);

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gerar PDF</h1>
          <p className="text-gray-600 mt-1">Exporte sua ficha completa em PDF</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Prévia do Documento</h2>
                <p className="text-sm text-gray-600">
                  Confira os dados que serão incluídos no PDF
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <User size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900">Dados Pessoais</h3>
              </div>
              {userFicha ? (
                <div className="ml-6 space-y-1 text-sm text-gray-600">
                  <p>
                    Nome: {userFicha.name} {userFicha.surname}
                  </p>
                  <p>E-mail: {userFicha.email}</p>
                </div>
              ) : (
                <p className="ml-6 text-sm text-gray-500">Sem dados cadastrados</p>
              )}
            </div>

            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Pill size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900">
                  Medicamentos ({userMedications.length})
                </h3>
              </div>
              {userMedications.length > 0 ? (
                <div className="ml-6 space-y-2">
                  {userMedications.slice(0, 3).map((med: any) => (
                    <div key={med.id} className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900">{med.name}</p>
                      <p>
                        {med.dosage} - {med.type} - {med.time}
                      </p>
                      {med.startDate && (
                        <p className="text-xs text-gray-500">
                          Início: {new Date(med.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {med.recurrence && med.recurrence.length > 0 && (
                        <p className="text-xs text-blue-600">
                          Dias: {med.recurrence.join(', ').toUpperCase()}
                        </p>
                      )}
                    </div>
                  ))}
                  {userMedications.length > 3 && (
                    <p className="text-sm text-gray-500">
                      +{userMedications.length - 3} medicamentos
                    </p>
                  )}
                </div>
              ) : (
                <p className="ml-6 text-sm text-gray-500">Nenhum medicamento cadastrado</p>
              )}
            </div>

            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900">Preferências Médicas</h3>
              </div>
              {(() => {
                const foodRestrictions = Array.isArray(userPreferences?.foodRestrictions)
                  ? userPreferences.foodRestrictions
                  : (userPreferences?.foodRestrictions ? [userPreferences.foodRestrictions] : []);
                const medicalRestrictions = Array.isArray(userPreferences?.medicalRestrictions)
                  ? userPreferences.medicalRestrictions
                  : (userPreferences?.medicalRestrictions ? [userPreferences.medicalRestrictions] : []);
                const allergies = Array.isArray(userPreferences?.allergies)
                  ? userPreferences.allergies
                  : (userPreferences?.allergies ? [userPreferences.allergies] : []);

                const hasData = foodRestrictions.length > 0 || medicalRestrictions.length > 0 || allergies.length > 0;

                return hasData ? (
                  <div className="ml-6 space-y-2 text-sm text-gray-600">
                    {foodRestrictions.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900">Restrições Alimentares:</p>
                        <ul className="list-disc list-inside">
                          {foodRestrictions.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {medicalRestrictions.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900">Restrições Médicas:</p>
                        <ul className="list-disc list-inside">
                          {medicalRestrictions.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {allergies.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900">Alergias:</p>
                        <ul className="list-disc list-inside">
                          {allergies.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="ml-6 text-sm text-gray-500">Nenhuma preferência cadastrada</p>
                );
              })()}
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900">
                  Histórico ({userNotifications.length} notificações)
                </h3>
              </div>
              {userNotifications.length > 0 ? (
                <p className="ml-6 text-sm text-gray-600">
                  Últimas {Math.min(5, userNotifications.length)} notificações incluídas
                </p>
              ) : (
                <p className="ml-6 text-sm text-gray-500">Sem histórico</p>
              )}
            </div>
          </div>
        </Card>

        <Button
          onClick={generatePDF}
          disabled={generating}
          className="w-full"
          size="lg"
        >
          <Download size={24} className="mr-2" />
          {generating ? 'Gerando PDF...' : 'Gerar e Baixar PDF'}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          O arquivo será baixado automaticamente após a geração
        </p>
      </div>
    </div>
  );
};
