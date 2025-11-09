import React from 'react';
import { QuotationItem, MarginType, Template } from '../types';

interface QuotationPreviewProps {
  items: QuotationItem[];
  marginType: MarginType;
  marginValue: number;
  currencySymbol?: string;
  clientName: string;
  clientPhone: string;
  companyName: string;
  companyLogo: string | null;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyDocumentType?: string;
  companyDocumentNumber?: string;
  selectedTemplate: Template;
  paymentTerms: string;
  paymentMethods: string;
  quotationNumber: string;
  themeColor: string;
  headerImage: string | null;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  items,
  marginType,
  marginValue,
  currencySymbol = 'S/',
  clientName,
  clientPhone,
  companyName,
  companyLogo,
  companyAddress,
  companyPhone,
  companyEmail,
  companyWebsite,
  companyDocumentType,
  companyDocumentNumber,
  selectedTemplate,
  paymentTerms,
  paymentMethods,
  quotationNumber,
  themeColor = '#EC4899',
  headerImage,
}) => {
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
  
  const companyDocumentInfo = companyDocumentType && companyDocumentNumber ? `${companyDocumentType}: ${companyDocumentNumber}` : '';
  const companyContactInfo = [companyAddress, companyPhone, companyEmail, companyWebsite].filter(Boolean);

  const renderTemplate = () => {
    // Shared structure for professional templates
    // Reduced font sizes and padding for a more compact design
    const ProfessionalLayout = ({ children, header, footer, totals }: { children: React.ReactNode; header: React.ReactNode; footer: React.ReactNode; totals: React.ReactNode }) => (
      <div className="bg-white p-7 font-sans text-gray-800 text-[9pt] leading-snug">
        {header}
        <section className="mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-bold text-gray-500 uppercase text-[8pt] tracking-wider mb-1">Cliente</h3>
            <p className="font-semibold text-gray-800">{clientName || "Nombre del Cliente"}</p>
            <p className="text-gray-600 text-[8.5pt]">{clientPhone || "Teléfono del Cliente"}</p>
          </div>
        </section>
        <main>{children}</main>
        {totals}
        {footer}
      </div>
    );
    
    // Reduced padding in table
    const DefaultTable = () => (
      <table className="w-full text-[8.5pt]">
        <thead style={{ backgroundColor: themeColor }}>
          <tr>
            <th className="p-2 text-left font-semibold text-white uppercase tracking-wider">Descripción</th>
            <th className="p-2 text-center font-semibold text-white uppercase tracking-wider w-16">Cant.</th>
            <th className="p-2 text-right font-semibold text-white uppercase tracking-wider w-28">P. Unit.</th>
            <th className="p-2 text-right font-semibold text-white uppercase tracking-wider w-28">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const finalPrice = calculateFinalPrice(item);
            const finalUnitPrice = item.quantity > 0 ? finalPrice / item.quantity : 0;
            return (
              <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                <td className="p-2 font-medium text-gray-800">{item.description}</td>
                <td className="p-2 text-center text-gray-600">{item.quantity}</td>
                <td className="p-2 text-right text-gray-600">{currencySymbol} {finalUnitPrice.toFixed(2)}</td>
                <td className="p-2 text-right font-semibold text-gray-800">{currencySymbol} {finalPrice.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );

    // Reduced margins and font sizes in totals
    const DefaultTotals = () => (
       <section className="flex justify-end mt-4">
        <div className="w-full max-w-xs text-[9pt]">
          <div className="flex justify-between py-1.5 text-gray-600 border-b border-gray-200"><p>Subtotal:</p><p>{currencySymbol} {baseSubtotal.toFixed(2)}</p></div>
          <div className="flex justify-between py-1.5 text-gray-600 border-b border-gray-200"><p>Margen ({marginType === MarginType.PERCENTAGE ? `${marginValue}%` : 'Fijo'}):</p><p>{currencySymbol} {marginAmount.toFixed(2)}</p></div>
          <div className="flex justify-between items-center py-2.5 mt-2 font-bold text-base rounded-lg px-3" style={{ backgroundColor: themeColor, color: 'white' }}>
            <p>Total:</p>
            <p>{currencySymbol} {total.toFixed(2)}</p>
          </div>
        </div>
      </section>
    );

    // Reduced margins and font sizes in footer
    const DefaultFooter = ({ className = "" }: { className?: string }) => (
      <footer className={`mt-8 pt-4 border-t border-gray-200 text-[8pt] text-gray-600 ${className}`}>
          {(paymentTerms || paymentMethods) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {paymentTerms && <div><h4 className="font-bold text-gray-700 mb-1 uppercase tracking-wider">Términos de Pago:</h4><p className="whitespace-pre-wrap">{paymentTerms}</p></div>}
                 {paymentMethods && <div><h4 className="font-bold text-gray-700 mb-1 uppercase tracking-wider">Métodos de Pago:</h4><p className="whitespace-pre-wrap">{paymentMethods}</p></div>}
              </div>
          )}
          <div className="mt-4 text-center text-gray-500">
            <p>{[companyName, ...companyContactInfo].filter(Boolean).join(' · ')}</p>
          </div>
      </footer>
    );


    switch (selectedTemplate) {
      case Template.CLASSIC:
      case Template.ELEGANT:
      case Template.MINIMALIST:
      case Template.MODERN:
      default: // Using a single, highly-professional template as the base for all non-bold ones.
        return (
          // Reduced font sizes, padding and margins
          <ProfessionalLayout
            header={(
              <header className="flex justify-between items-start mb-6 pb-3 border-b-2" style={{borderColor: themeColor}}>
                <div>
                  {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-14 mb-3 object-contain" />}
                  <h1 className="text-xl font-bold text-gray-900">{companyName || "Nombre de tu Empresa"}</h1>
                  {companyDocumentInfo && <p className="text-[8.5pt] text-gray-500 font-semibold">{companyDocumentInfo}</p>}
                  {companyAddress && <p className="text-[8.5pt] text-gray-500">{companyAddress}</p>}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold uppercase" style={{ color: themeColor }}>Cotización</h2>
                  <p className="text-[9pt] mt-1"><span className="font-semibold text-gray-600">Nro:</span> {quotationNumber}</p>
                  <p className="text-[9pt]"><span className="font-semibold text-gray-600">Fecha:</span> {new Date().toLocaleDateString('es-PE')}</p>
                </div>
              </header>
            )}
            totals={<DefaultTotals />}
            footer={<DefaultFooter />}
            children={<DefaultTable />}
          />
        );
        
      case Template.BOLD:
        return (
          <div className="bg-white font-sans text-gray-800 text-[9pt]">
            <header 
              className="text-white p-6 relative bg-cover bg-center" 
              style={{ 
                backgroundColor: themeColor,
                backgroundImage: headerImage ? `url(${headerImage})` : 'none'
              }}
            >
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">{companyName || "Empresa"}</h1>
                  {companyDocumentInfo && <p className="text-[8.5pt] mt-1 opacity-90">{companyDocumentInfo}</p>}
                  <p className="text-base mt-1 font-semibold">COTIZACIÓN</p>
                </div>
                <div className="text-right">
                  {companyLogo && 
                    <div className="w-16 h-16 bg-white/90 rounded-lg flex items-center justify-center mb-2 ml-auto">
                      <img src={companyLogo} alt="Logo" className="max-h-12 max-w-12 object-contain" />
                    </div>
                  }
                  <p className="font-semibold">{quotationNumber}</p>
                  <p className="opacity-90 text-[8.5pt]">{new Date().toLocaleDateString('es-PE')}</p>
                </div>
              </div>
            </header>
             <div className="p-7">
                <section className="mb-6 bg-gray-50 rounded-lg p-3">
                  <h3 className="font-bold text-gray-500 uppercase text-[8pt] tracking-wider mb-1">Para</h3>
                  <p className="font-semibold text-gray-800 text-base">{clientName || "Nombre del Cliente"}</p>
                  <p className="text-gray-600 text-[8.5pt]">{clientPhone || "Teléfono del Cliente"}</p>
                </section>
                
                <DefaultTable />
                
                <section className="bg-gray-100 p-4 mt-4 flex justify-end rounded-lg">
                  <div className="w-full max-w-xs text-[9pt]">
                    <div className="flex justify-between py-1 text-gray-600"><p>Subtotal</p><p>{currencySymbol} {baseSubtotal.toFixed(2)}</p></div>
                    <div className="flex justify-between py-1 text-gray-600"><p>Margen</p><p>{currencySymbol} {marginAmount.toFixed(2)}</p></div>
                    <div className="flex justify-between py-1.5 mt-1.5 text-lg font-bold border-t-2 border-gray-300"><p>TOTAL</p><p style={{color: themeColor}}>{currencySymbol} {total.toFixed(2)}</p></div>
                  </div>
                </section>
                 
                <DefaultFooter className="!text-[8.5pt]" />
             </div>
          </div>
        );
    }
  };

  return <div id="quotation-preview">{renderTemplate()}</div>;
};

export default QuotationPreview;