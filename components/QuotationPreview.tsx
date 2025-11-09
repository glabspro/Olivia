import React, { useRef } from 'react';
import { QuotationItem, MarginType, Template } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Edit3, Palette, User } from 'lucide-react';

// Templates are designed to be theme-neutral (black/white) for professional PDF output
const templateOptions = {
    [Template.MODERN]: {
        name: 'Moderno',
        containerClasses: 'border-gray-800',
        headerClasses: 'text-gray-900',
        totalClasses: 'text-gray-900',
        tableHeaderClasses: 'bg-gray-100',
    },
    [Template.CLASSIC]: {
        name: 'Clásico',
        containerClasses: 'border-gray-700 font-serif',
        headerClasses: 'text-gray-800',
        totalClasses: 'text-gray-800',
        tableHeaderClasses: 'bg-gray-200',
    },
    [Template.MINIMALIST]: {
        name: 'Minimalista',
        containerClasses: 'border-gray-300',
        headerClasses: 'text-gray-700 font-light',
        totalClasses: 'text-gray-900',
        tableHeaderClasses: 'border-b border-gray-200 bg-white',
    },
    [Template.ELEGANT]: {
        name: 'Elegante',
        containerClasses: 'border-blue-400 font-sans',
        headerClasses: 'text-blue-700',
        totalClasses: 'text-blue-700',
        tableHeaderClasses: 'bg-blue-50',
    },
    [Template.BOLD]: {
        name: 'Audaz',
        containerClasses: 'border-red-600 font-bold',
        headerClasses: 'text-red-800',
        totalClasses: 'text-red-800',
        tableHeaderClasses: 'bg-red-100',
    },
};


interface QuotationPreviewProps {
  items: QuotationItem[];
  marginType: MarginType;
  marginValue: number;
  currencySymbol?: string;
  clientName: string;
  setClientName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  companyName: string;
  companyLogo: string | null;
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template) => void;
  ActionPanel: React.ReactNode;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  items,
  marginType,
  marginValue,
  currencySymbol = 'S/',
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  companyName,
  companyLogo,
  selectedTemplate,
  setSelectedTemplate,
  ActionPanel,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const actionPanelRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const previewElement = previewRef.current;
    if (!previewElement) return;

    const controlsToHide = actionPanelRef.current;
    const originalDisplay = controlsToHide ? controlsToHide.style.display : '';
    if (controlsToHide) controlsToHide.style.display = 'none';

    html2canvas(previewElement, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff',
      // Exclude the action panel from the canvas itself
      ignoreElements: (element) => element.contains(actionPanelRef.current),
    })
    .then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Cotizacion-${clientName.replace(/ /g,"_") || 'cliente'}.pdf`);
    })
    .catch(err => {
        console.error("Error generating PDF:", err);
        alert("Hubo un problema al generar el PDF. Por favor, intente de nuevo.");
    })
    .finally(() => {
        if (controlsToHide) controlsToHide.style.display = originalDisplay;
    });
  };

  const calculateFinalPrice = (item: QuotationItem): number => {
    const baseTotal = item.quantity * item.unitPrice;
    if (marginType === MarginType.PERCENTAGE) {
      return baseTotal * (1 + marginValue / 100);
    }
    return baseTotal;
  };
  
  const baseSubtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = marginType === MarginType.FIXED ? baseSubtotal + marginValue : baseSubtotal * (1 + marginValue / 100);
  const marginAmount = total - baseSubtotal;
  const currentTemplate = templateOptions[selectedTemplate];

  return (
    <div className="w-full bg-background dark:bg-dark-surface rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      
      {/* --- ACTION PANEL --- */}
      <div className="action-panel-container mb-6" ref={actionPanelRef}>
          <div className="space-y-6">
              <div>
                  <h3 className="text-md font-semibold text-accent-teal flex items-center gap-2 mb-2"><User size={16}/> Datos del Cliente</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input 
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full px-4 py-3 bg-surface dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
                          placeholder="Nombre del Cliente"
                      />
                      <input 
                          type="text"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-surface dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
                          placeholder="Teléfono (ej. 519...)"
                      />
                   </div>
              </div>
              <div>
                 <h3 className="text-md font-semibold text-accent-coral flex items-center gap-2 mb-2"><Palette size={16}/> Diseño</h3>
                  <div className="flex flex-wrap gap-2">
                      {Object.values(Template).map((templateId) => (
                          <button
                              key={templateId}
                              onClick={() => setSelectedTemplate(templateId)}
                              className={`px-4 py-3 sm:py-2 text-sm font-semibold rounded-md transition-colors ${
                                  selectedTemplate === templateId
                                      ? 'bg-primary text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-textSecondary dark:text-dark-textSecondary hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                          >
                              {templateOptions[templateId].name}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                 {ActionPanel}
                 <button
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center justify-center gap-2 text-center px-4 py-4 text-sm font-semibold text-accent-teal border-2 border-accent-teal rounded-lg hover:bg-accent-teal/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={items.length === 0}
                  >
                    <Download size={16} />
                    Descargar PDF
                  </button>
              </div>
          </div>
      </div>


      {/* --- VISUAL PREVIEW --- */}
      <div id="quotation-preview-container" className="bg-gray-100 dark:bg-dark-background p-2 sm:p-4 rounded-lg">
        <div className={`border rounded-lg p-6 sm:p-8 bg-white ${currentTemplate.containerClasses}`} ref={previewRef}>
            <header className="flex justify-between items-start pb-6 border-b">
              <div className="flex flex-col">
                <p className={`text-2xl font-bold p-1 -ml-1 ${currentTemplate.headerClasses}`}>
                  {companyName || "Nombre de tu Empresa"}
                </p>
                <span className="text-sm text-gray-500">Fecha: {new Date().toLocaleDateString('es-PE')}</span>
              </div>
              <div className="text-right">
                <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center">
                  {companyLogo ? <img src={companyLogo} alt="Company Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-center text-gray-500">Logo</span>}
                </div>
              </div>
            </header>

            <section className="my-6 text-gray-700">
              <h3 className="font-semibold text-gray-800 mb-2">Cotización para:</h3>
              <p className="text-lg">{clientName || "Nombre del Cliente"}</p>
              <p className="text-lg">{clientPhone || "Teléfono del Cliente"}</p>
            </section>

            <section>
              <table className="w-full text-sm text-left text-gray-600">
                <thead className={`text-xs text-gray-800 uppercase ${currentTemplate.tableHeaderClasses}`}>
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Descripción</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium">Cant.</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">P. Unitario</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                      const finalPrice = calculateFinalPrice(item);
                      const finalUnitPrice = item.quantity > 0 ? finalPrice / item.quantity : 0;
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.description}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{currencySymbol} {finalUnitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">{currencySymbol} {finalPrice.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </section>

            <section className="mt-6 flex justify-end">
              <div className="w-full md:w-2/5 text-gray-800">
                <div className="flex justify-between py-1 text-base">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{currencySymbol} {baseSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-base">
                  <span className="text-gray-600">Margen ({marginType === MarginType.PERCENTAGE ? `${marginValue}%` : 'Fijo'}):</span>
                  <span>{currencySymbol} {marginAmount.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-bold text-lg mt-2 pt-2 border-t ${currentTemplate.totalClasses}`}>
                  <span>Total:</span>
                  <span>{currencySymbol} {total.toFixed(2)}</span>
                </div>
              </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;