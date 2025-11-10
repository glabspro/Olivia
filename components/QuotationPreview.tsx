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
    // For fixed margin, the adjustment is on the total, not per item.
    // So for the table, we show the price before the fixed margin is added.
    return baseTotal;
  };
  
  const calculateFinalUnitPrice = (item: QuotationItem): number => {
      const itemTotal = calculateFinalPrice(item);
      // Avoid division by zero
      if (item.quantity === 0) return 0;
      return itemTotal / item.quantity;
  }

  const baseSubtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = marginType === MarginType.FIXED ? baseSubtotal + marginValue : baseSubtotal * (1 + marginValue / 100);
  const marginAmount = total - baseSubtotal;
  
  const companyDocumentInfo = companyDocumentType && companyDocumentNumber ? `${companyDocumentType}: ${companyDocumentNumber}` : '';
  const companyContactInfo = [companyAddress, companyPhone, companyEmail, companyWebsite].filter(Boolean);

  const renderTemplate = () => {
    
    // --- SHARED COMPONENTS (REFINED) ---
    const TotalsSection = ({ showMargin = true, simple = false }) => (
      <section className="flex justify-end mt-6">
        <div className={`w-full ${simple ? 'max-w-[240px]' : 'max-w-[300px]'} text-[8.5pt]`}>
          <div className="flex justify-between py-1.5 border-b border-gray-100 text-gray-600"><p>Subtotal:</p><p>{currencySymbol} {baseSubtotal.toFixed(2)}</p></div>
          {showMargin && <div className="flex justify-between py-1.5 border-b border-gray-100 text-gray-600"><p>Margen ({marginType === MarginType.PERCENTAGE ? `${marginValue}%` : 'Fijo'}):</p><p>{currencySymbol} {marginAmount.toFixed(2)}</p></div>}
          <div className="flex justify-between items-center pt-2 mt-1 font-bold text-base" style={{ borderTop: simple ? '1px solid #ddd' : `2px solid ${themeColor}` }}>
              <p>Total:</p>
              <p style={{ color: simple ? 'inherit' : themeColor }}>{currencySymbol} {total.toFixed(2)}</p>
          </div>
        </div>
      </section>
    );

    const FooterSection = () => (
      <footer className="mt-8 pt-4 border-t border-gray-100 text-[8pt] text-gray-500">
        {(paymentTerms || paymentMethods) && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            {paymentTerms && <div><h4 className="font-semibold text-gray-600 mb-1 uppercase tracking-wider text-[7.5pt]">Términos:</h4><p className="whitespace-pre-wrap">{paymentTerms}</p></div>}
            {paymentMethods && <div><h4 className="font-semibold text-gray-600 mb-1 uppercase tracking-wider text-[7.5pt]">Métodos de Pago:</h4><p className="whitespace-pre-wrap">{paymentMethods}</p></div>}
          </div>
        )}
        <div className="mt-4 text-center text-gray-400 text-[7.5pt]">
            <p className="font-bold text-gray-600">{companyName}</p>
            <p>{companyContactInfo.join(' · ')}</p>
            <p className="mt-1">Gracias por su preferencia.</p>
        </div>
      </footer>
    );

    const ItemsTable = ({ headerBgColor, headerTextColor, borders = 'horizontal' }: { headerBgColor?: string, headerTextColor?: string, borders?: 'horizontal' | 'all' | 'none' }) => {
       const borderClasses = {
            horizontal: 'border-b border-gray-100 last:border-0',
            all: 'border border-gray-200',
            none: ''
       };
       return (
        <table className="w-full text-[8.5pt]">
            <thead>
                <tr style={{ backgroundColor: headerBgColor || `${themeColor}1A`, color: headerTextColor || themeColor }}>
                    <th className="p-2.5 text-center font-semibold uppercase tracking-wider text-[7.5pt] w-12">Item</th>
                    <th className="p-2.5 text-left font-semibold uppercase tracking-wider text-[7.5pt]">Descripción</th>
                    <th className="p-2.5 text-center font-semibold uppercase tracking-wider text-[7.5pt] w-16">Cant.</th>
                    <th className="p-2.5 text-right font-semibold uppercase tracking-wider text-[7.5pt] w-28">P. Unit.</th>
                    <th className="p-2.5 text-right font-semibold uppercase tracking-wider text-[7.5pt] w-28">Total</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={item.id} className={borderClasses[borders]}>
                        <td className={`p-2.5 text-center align-top text-gray-600 ${borders === 'all' ? 'border-r' : ''}`}>{index + 1}</td>
                        <td className={`p-2.5 align-top text-gray-800 ${borders === 'all' ? 'border-r' : ''}`}>{item.description}</td>
                        <td className={`p-2.5 text-center align-top text-gray-600 ${borders === 'all' ? 'border-r' : ''}`}>{item.quantity}</td>
                        <td className={`p-2.5 text-right align-top text-gray-600 ${borders === 'all' ? 'border-r' : ''}`}>{currencySymbol} {calculateFinalUnitPrice(item).toFixed(2)}</td>
                        <td className="p-2.5 text-right align-top font-semibold text-gray-800">{currencySymbol} {calculateFinalPrice(item).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
       );
    };

    // --- TEMPLATE-SPECIFIC COMPONENTS ---

    const ModernTemplate = () => (
      <div className="bg-white p-10 font-sans text-gray-800 text-[9pt] leading-relaxed">
        <header className="flex justify-between items-start mb-8 pb-3 border-b-2" style={{borderColor: themeColor}}>
          <div>
            {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-14 mb-4 object-contain" />}
            <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-[8.5pt] text-gray-500">{companyDocumentInfo}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase" style={{ color: themeColor }}>Cotización</h2>
            <p className="text-[8.5pt] mt-1"><span className="font-semibold text-gray-600">Nro:</span> {quotationNumber}</p>
            <p className="text-[8.5pt]"><span className="font-semibold text-gray-600">Fecha:</span> {new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </header>
        <section className="mb-8">
            <h3 className="font-semibold text-gray-500 uppercase text-[8pt] tracking-wider mb-1">Cliente</h3>
            <p className="font-bold text-gray-900 text-base">{clientName}</p>
            <p className="text-gray-600">{clientPhone}</p>
        </section>
        <main><ItemsTable /></main>
        <TotalsSection />
        <FooterSection />
      </div>
    );

    const ClassicTemplate = () => (
      <div className="bg-white p-10 font-serif text-gray-800 text-[9pt] leading-relaxed">
        <header className="text-center mb-8">
            {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-16 mb-3 object-contain mx-auto" />}
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-[8.5pt] text-gray-500">{companyContactInfo.slice(0, 2).join(' | ')}</p>
            <p className="text-[8.5pt] text-gray-500">{companyDocumentInfo}</p>
        </header>
        <div className="w-full h-px bg-gray-300 my-4"></div>
        <div className="w-1/3 h-px bg-gray-300 my-4 mx-auto"></div>
        <section className="grid grid-cols-2 gap-8 mb-8 text-[8.5pt]">
            <div>
              <h3 className="font-bold text-gray-600">PARA:</h3>
              <p>{clientName}</p>
              <p>{clientPhone}</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-600">COTIZACIÓN NRO:</h3>
              <p>{quotationNumber}</p>
              <h3 className="font-bold text-gray-600 mt-1">FECHA:</h3>
              <p>{new Date().toLocaleDateString('es-PE')}</p>
            </div>
        </section>
        <main><ItemsTable borders="all" headerBgColor="#F3F4F6" headerTextColor="#374151" /></main>
        <TotalsSection />
        <FooterSection />
      </div>
    );

    const MinimalistTemplate = () => (
      <div className="bg-white p-10 font-sans text-gray-700 text-[8.5pt] leading-relaxed">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-lg font-semibold tracking-widest uppercase">{companyName}</h1>
          <div className="text-right text-xs">
            <p>Cotización {quotationNumber}</p>
            <p className="text-gray-500">{new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </header>
        <section className="mb-8 text-xs">
          <p className="text-gray-500">Preparado para:</p>
          <p className="text-base font-semibold">{clientName}</p>
        </section>
        <main><ItemsTable borders="horizontal" headerBgColor="#FFFFFF" headerTextColor="#6B7280" /></main>
        <TotalsSection simple={true} />
        <footer className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-500">
          {(paymentTerms || paymentMethods) && (
            <div className="mb-4">
              {paymentTerms && <p><span className="font-semibold">Términos:</span> {paymentTerms}</p>}
              {paymentMethods && <p><span className="font-semibold">Pagos:</span> {paymentMethods}</p>}
            </div>
          )}
          <p>{companyContactInfo.join(' | ')}</p>
        </footer>
      </div>
    );
    
    const ElegantTemplate = () => (
        <div className="bg-white p-10 font-serif text-gray-800 text-[9pt] leading-relaxed">
            <header className="grid grid-cols-10 gap-8 mb-8 items-start">
                <div className="col-span-3 text-center">
                    {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-20 mb-3 object-contain mx-auto" />}
                </div>
                <div className="col-span-7 pt-2">
                    <h1 className="text-2xl font-light tracking-wider">{companyName}</h1>
                    <p className="text-[8.5pt] text-gray-500">{companyAddress}</p>
                    <p className="text-[8.5pt] text-gray-500">{[companyPhone, companyEmail].filter(Boolean).join(' | ')}</p>
                </div>
            </header>
            <div className="w-full h-px my-6" style={{background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)`}}></div>
            <section className="flex justify-between items-start mb-8 text-[8.5pt]">
                <div className="bg-gray-50 p-3 rounded w-2/5">
                    <h3 className="font-semibold text-gray-500 tracking-wide text-xs">CLIENTE</h3>
                    <p className="font-medium text-gray-800">{clientName}</p>
                    <p className="text-gray-600">{clientPhone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-light tracking-wide" style={{ color: themeColor }}>C O T I Z A C I Ó N</h2>
                    <p className="mt-1"><span className="font-semibold text-gray-500">Nro:</span> {quotationNumber}</p>
                    <p><span className="font-semibold text-gray-500">Fecha:</span> {new Date().toLocaleDateString('es-PE')}</p>
                </div>
            </section>
            <main><ItemsTable headerBgColor="transparent" headerTextColor={themeColor} /></main>
            <TotalsSection />
            <FooterSection />
        </div>
    );

    const BoldTemplate = () => (
      <div className="bg-white font-sans text-gray-800 text-[9pt]">
        <header 
          className="text-white p-8 relative bg-cover bg-center" 
          style={{ 
            backgroundColor: themeColor,
            backgroundImage: headerImage ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${headerImage})` : 'none'
          }}
        >
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{companyName}</h1>
              {companyDocumentInfo && <p className="text-[8pt] mt-1 opacity-90">{companyDocumentInfo}</p>}
              <p className="text-xl mt-2 font-semibold">COTIZACIÓN</p>
            </div>
            <div className="text-right">
              {companyLogo && 
                <div className="w-16 h-16 bg-white/95 rounded-lg flex items-center justify-center mb-2 ml-auto">
                  <img src={companyLogo} alt="Logo" className="max-h-12 max-w-12 object-contain" />
                </div>
              }
              <p className="font-semibold">{quotationNumber}</p>
              <p className="opacity-90 text-[8pt]">{new Date().toLocaleDateString('es-PE')}</p>
            </div>
          </div>
        </header>
        <div className="p-8">
            <section className="mb-6 bg-gray-50 rounded-md p-4">
              <h3 className="font-bold text-gray-500 uppercase text-[7.5pt] tracking-wider mb-1">Para</h3>
              <p className="font-bold text-gray-800 text-base">{clientName}</p>
              <p className="text-gray-600 text-[8.5pt]">{clientPhone}</p>
            </section>
            
            <ItemsTable headerBgColor="#F3F4F6" headerTextColor="#374151" />
            
            <section className="bg-gray-100 p-4 mt-6 flex justify-end rounded-lg">
              <div className="w-full max-w-xs text-[8.5pt]">
                <div className="flex justify-between py-1 text-gray-600"><p>Subtotal</p><p>{currencySymbol} {baseSubtotal.toFixed(2)}</p></div>
                <div className="flex justify-between py-1 text-gray-600"><p>Margen</p><p>{currencySymbol} {marginAmount.toFixed(2)}</p></div>
                <div className="flex justify-between py-1.5 mt-1.5 text-base font-bold border-t-2 border-gray-300"><p>TOTAL</p><p style={{color: themeColor}}>{currencySymbol} {total.toFixed(2)}</p></div>
              </div>
            </section>
             
            <FooterSection />
        </div>
      </div>
    );

    switch (selectedTemplate) {
      case Template.CLASSIC: return <ClassicTemplate />;
      case Template.MINIMALIST: return <MinimalistTemplate />;
      case Template.ELEGANT: return <ElegantTemplate />;
      case Template.BOLD: return <BoldTemplate />;
      case Template.MODERN:
      default:
        return <ModernTemplate />;
    }
  };

  return <div id="quotation-preview">{renderTemplate()}</div>;
};

export default QuotationPreview;