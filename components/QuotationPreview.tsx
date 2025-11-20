
import React from 'react';
import { QuotationItem, MarginType, Template, TaxType, DiscountType } from '../types';

interface QuotationPreviewProps {
  items: QuotationItem[];
  marginType: MarginType;
  marginValue: number;
  discountType?: DiscountType;
  discountValue?: number;
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
  taxType: TaxType;
  taxRate: number;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  items,
  marginType,
  marginValue,
  discountType = DiscountType.AMOUNT,
  discountValue = 0,
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
  taxType,
  taxRate,
}) => {
  const calculateFinalPrice = (item: QuotationItem): number => {
    const baseTotal = item.quantity * item.unitPrice;
    if (marginType === MarginType.PERCENTAGE) {
      return baseTotal * (1 + marginValue / 100);
    }
    return baseTotal;
  };
  
  const calculateFinalUnitPrice = (item: QuotationItem): number => {
      const itemTotal = calculateFinalPrice(item);
      if (item.quantity === 0) return 0;
      return itemTotal / item.quantity;
  }

  const totalWithMargin = items.reduce((acc, item) => acc + calculateFinalPrice(item), 0);
  
  // Apply Discount
  let discountAmount = 0;
  if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = totalWithMargin * (discountValue / 100);
  } else {
      discountAmount = discountValue;
  }
  const totalAfterDiscount = Math.max(0, totalWithMargin - discountAmount);
  
  let subtotal, igvAmount, finalTotal;
  const taxRateDecimal = taxRate / 100;

  if (taxType === TaxType.INCLUDED) {
      finalTotal = totalAfterDiscount;
      subtotal = finalTotal / (1 + taxRateDecimal);
      igvAmount = finalTotal - subtotal;
  } else { // TaxType.ADDED
      subtotal = totalAfterDiscount;
      igvAmount = subtotal * taxRateDecimal;
      finalTotal = subtotal + igvAmount;
  }

  const companyDocumentInfo = companyDocumentType && companyDocumentNumber ? `${companyDocumentType}: ${companyDocumentNumber}` : '';
  const companyContactInfo = [companyAddress, companyPhone, companyEmail, companyWebsite].filter(Boolean);

  const renderTemplate = () => {
    
    // --- SHARED TABLE COMPONENT ---
    const ItemsTable = ({ headerBgColor, headerTextColor, borders = 'horizontal', rowBorderColor = 'border-gray-100' }: { headerBgColor?: string, headerTextColor?: string, borders?: 'horizontal' | 'all' | 'none', rowBorderColor?: string }) => {
       const borderClasses = {
            horizontal: `border-b ${rowBorderColor} last:border-0`,
            all: `border ${rowBorderColor}`,
            none: ''
       };
       // Reduced padding from p-2.5 to px-2 py-1.5 for better fit
       return (
        <table className="w-full text-[8.5pt]">
            <thead style={{ backgroundColor: headerBgColor || `${themeColor}1A`, color: headerTextColor || themeColor }}>
                <tr>
                    <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-wider text-[7.5pt] w-10">Item</th>
                    <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-[7.5pt]">Descripción</th>
                    <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-wider text-[7.5pt] w-14">Cant.</th>
                    <th className="px-2 py-1.5 text-right font-semibold uppercase tracking-wider text-[7.5pt] w-24">P. Unit.</th>
                    <th className="px-2 py-1.5 text-right font-semibold uppercase tracking-wider text-[7.5pt] w-24">Total</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={item.id} className={borderClasses[borders]}>
                        <td className={`px-2 py-1.5 text-center align-top text-gray-600 ${borders === 'all' ? 'border-r' : ''}`}>{index + 1}</td>
                        <td className={`px-2 py-1.5 align-top text-gray-800 ${borders === 'all' ? 'border-r' : ''}`}>{item.description}</td>
                        <td className={`px-2 py-1.5 text-center align-top text-gray-600 ${borders === 'all' ? 'border-r' : ''}`}>{item.quantity}</td>
                        <td className={`px-2 py-1.5 text-right align-top text-gray-600 ${borders === 'all' ? 'border-r' : ''}`}>{currencySymbol} {calculateFinalUnitPrice(item).toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right align-top font-semibold text-gray-800">{currencySymbol} {calculateFinalPrice(item).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
       );
    };

    const SummarySection = ({ borderColor = 'gray-200', textColor = 'gray-600', totalColor = 'gray-900', totalBorderColor }: any) => (
        <div className="w-full max-w-[300px] text-[8.5pt]">
            <div className={`flex justify-between py-1 border-b border-${borderColor} text-${textColor}`}><p>Subtotal:</p><p>{currencySymbol} {totalWithMargin.toFixed(2)}</p></div>
            {discountAmount > 0 && (
                 <div className={`flex justify-between py-1 border-b border-${borderColor} text-red-500`}><p>Descuento:</p><p>- {currencySymbol} {discountAmount.toFixed(2)}</p></div>
            )}
            <div className={`flex justify-between py-1 border-b border-${borderColor} text-${textColor}`}><p>Base Imponible:</p><p>{currencySymbol} {subtotal.toFixed(2)}</p></div>
            <div className={`flex justify-between py-1 border-b border-${borderColor} text-${textColor}`}><p>IGV ({taxRate}%):</p><p>{currencySymbol} {igvAmount.toFixed(2)}</p></div>
            <div className={`flex justify-between items-center pt-2 mt-1 font-bold text-base`} style={{ borderTop: totalBorderColor ? `2px solid ${totalBorderColor}` : 'none', color: totalBorderColor || totalColor }}>
                <p>Total:</p>
                <p>{currencySymbol} {finalTotal.toFixed(2)}</p>
            </div>
        </div>
    );

    // --- TEMPLATE-SPECIFIC COMPONENTS ---

    const ModernTemplate = () => (
      // Reduced padding from p-10 to p-8
      <div className="bg-white p-8 font-sans text-gray-800 text-[9pt] leading-relaxed">
        <header className="flex justify-between items-start mb-6 pb-3 border-b-2" style={{borderColor: themeColor}}>
          <div>
            {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-14 mb-3 object-contain" />}
            <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-[8.5pt] text-gray-500">{companyDocumentInfo}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase" style={{ color: themeColor }}>Cotización</h2>
            <p className="text-[8.5pt] mt-1"><span className="font-semibold text-gray-600">Nro:</span> {quotationNumber}</p>
            <p className="text-[8.5pt]"><span className="font-semibold text-gray-600">Fecha:</span> {new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </header>
        <section className="mb-6">
            <h3 className="font-semibold text-gray-500 uppercase text-[8pt] tracking-wider mb-1">Cliente</h3>
            <p className="font-bold text-gray-900 text-base">{clientName}</p>
            <p className="text-gray-600">{clientPhone}</p>
        </section>
        <main><ItemsTable /></main>
        <section className="flex justify-end mt-6">
            <SummarySection borderColor="gray-100" totalBorderColor={themeColor} />
        </section>
        <footer className="mt-6 pt-3 border-t border-gray-100 text-[7.5pt] text-gray-500">
            {(paymentTerms || paymentMethods) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {paymentTerms && <div><h4 className="font-semibold text-gray-600 mb-0.5 uppercase tracking-wider text-[7pt]">Términos:</h4><p className="whitespace-pre-wrap">{paymentTerms}</p></div>}
                    {paymentMethods && <div><h4 className="font-semibold text-gray-600 mb-0.5 uppercase tracking-wider text-[7pt]">Métodos de Pago:</h4><p className="whitespace-pre-wrap">{paymentMethods}</p></div>}
                </div>
            )}
            <div className="mt-4 text-center text-gray-400 text-[7pt]">
                <p className="font-bold text-gray-600">{companyName}</p>
                <p>{companyContactInfo.join(' · ')}</p>
            </div>
        </footer>
      </div>
    );

    const ClassicTemplate = () => (
      // Reduced padding from p-8 to p-6
      <div className="bg-white p-6 font-serif text-gray-800 text-[9pt] leading-relaxed border-4 double border-gray-400">
        <header className="text-center mb-5">
            {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-14 mb-2 object-contain mx-auto" />}
            <h1 className="text-2xl tracking-widest uppercase font-bold text-gray-900">{companyName}</h1>
            <p className="text-[8.5pt] text-gray-500">{companyContactInfo.slice(0, 2).join(' | ')}</p>
            <p className="text-[8.5pt] text-gray-500">{companyDocumentInfo}</p>
        </header>
        <div className="w-full h-px bg-gray-300 my-3"></div>
        <section className="grid grid-cols-2 gap-8 mb-5 text-[8.5pt]">
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
        <main><ItemsTable borders="all" headerBgColor="#E5E7EB" headerTextColor="#374151" rowBorderColor="border-gray-300" /></main>
        <section className="flex justify-end mt-5">
            <SummarySection borderColor="gray-200" />
        </section>
        <footer className="mt-5 pt-3 border-t-2 border-gray-300 text-[7.5pt] text-gray-600">
             {(paymentTerms || paymentMethods) && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                    {paymentTerms && <div><h4 className="font-bold mb-0.5">Términos:</h4><p className="whitespace-pre-wrap">{paymentTerms}</p></div>}
                    {paymentMethods && <div><h4 className="font-bold mb-0.5">Métodos de Pago:</h4><p className="whitespace-pre-wrap">{paymentMethods}</p></div>}
                </div>
            )}
            <p className="mt-4 text-center text-gray-500 text-[7pt]">Gracias por su preferencia.</p>
        </footer>
      </div>
    );

    const MinimalistTemplate = () => (
      // Reduced padding from p-12 to p-8
      <div className="bg-white p-8 font-sans text-gray-700 text-[8pt] leading-normal">
        <header className="flex justify-between items-start mb-8">
          <h1 className="text-base font-bold tracking-[0.2em] uppercase">{companyName}</h1>
          <div className="text-right text-[8.5pt]">
            <p className="font-bold">Cotización</p>
            <p>{quotationNumber}</p>
          </div>
        </header>
        <section className="grid grid-cols-2 gap-8 mb-8 text-[8.5pt]">
            <div>
                <p className="text-gray-500 tracking-wider uppercase text-[7pt] mb-1">Para</p>
                <p className="font-semibold text-base text-gray-900">{clientName}</p>
                <p>{clientPhone}</p>
            </div>
             <div className="text-right">
                <p className="text-gray-500 tracking-wider uppercase text-[7pt] mb-1">Fecha</p>
                <p>{new Date().toLocaleDateString('es-PE')}</p>
            </div>
        </section>
        <main>
          <table className="w-full text-[8.5pt]">
            <thead>
                <tr className="border-b border-gray-200">
                    <th className="px-2 py-1.5 text-center font-bold uppercase tracking-wider text-[7pt] text-gray-500 w-10">#</th>
                    <th className="px-2 py-1.5 text-left font-bold uppercase tracking-wider text-[7pt] text-gray-500">Descripción</th>
                    <th className="px-2 py-1.5 text-center font-bold uppercase tracking-wider text-[7pt] text-gray-500 w-14">Cant.</th>
                    <th className="px-2 py-1.5 text-right font-bold uppercase tracking-wider text-[7pt] text-gray-500 w-24">P. Unit.</th>
                    <th className="px-2 py-1.5 text-right font-bold uppercase tracking-wider text-[7pt] text-gray-500 w-24">Total</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-2 py-1.5 text-center align-top text-gray-500">{index + 1}</td>
                        <td className="px-2 py-1.5 align-top text-gray-800">{item.description}</td>
                        <td className="px-2 py-1.5 text-center align-top">{item.quantity}</td>
                        <td className="px-2 py-1.5 text-right align-top">{currencySymbol} {calculateFinalUnitPrice(item).toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right align-top font-semibold text-gray-800">{currencySymbol} {calculateFinalPrice(item).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
          </table>
        </main>
        <section className="flex justify-end mt-6">
            <SummarySection borderColor="gray-200" />
        </section>
        <footer className="mt-8 pt-3 border-t border-gray-200 text-[7pt] text-gray-500">
          {(paymentTerms || paymentMethods) && (
            <div className="mb-3 whitespace-pre-wrap">
              {paymentTerms && <p><span className="font-semibold">Términos:</span> {paymentTerms}</p>}
              {paymentMethods && <p><span className="font-semibold">Pagos:</span> {paymentMethods}</p>}
            </div>
          )}
          <p>{companyContactInfo.join(' | ')}</p>
        </footer>
      </div>
    );
    
    const ElegantTemplate = () => (
        // Reduced padding from p-12 to p-8
        <div className="bg-white p-8 font-serif text-gray-700 text-[9pt] leading-loose">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-thin" style={{color: themeColor}}>{companyName}</h1>
                    <p className="text-[8pt] text-gray-500 tracking-widest">{companyAddress}</p>
                </div>
                {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-14 object-contain" />}
            </header>
            <section className="mb-8 text-right">
                <h2 className="text-2xl font-light tracking-widest text-gray-500 mb-1">COTIZACIÓN</h2>
                <p className="text-sm font-semibold">{quotationNumber}</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString('es-PE')}</p>
            </section>
            <section className="mb-8 border-t border-b border-gray-100 py-3">
                <p className="text-xs text-gray-500 tracking-wider">CLIENTE</p>
                <p className="text-lg font-medium text-gray-800">{clientName}</p>
            </section>

            <main><ItemsTable borders="none" headerBgColor="transparent" headerTextColor={themeColor} /></main>
            
            <section className="flex justify-end mt-8">
                <SummarySection borderColor="gray-100" totalBorderColor={themeColor} />
            </section>
            <footer className="mt-8 pt-4 text-[7.5pt] text-gray-500">
                <div className="w-full h-px mb-4" style={{background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)`}}></div>
                {(paymentTerms || paymentMethods) && (
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        {paymentTerms && <div><h4 className="font-semibold text-gray-600 mb-0.5 tracking-wider text-[7pt]">TÉRMINOS Y CONDICIONES</h4><p className="whitespace-pre-wrap">{paymentTerms}</p></div>}
                        {paymentMethods && <div><h4 className="font-semibold text-gray-600 mb-0.5 tracking-wider text-[7pt]">MÉTODOS DE PAGO</h4><p className="whitespace-pre-wrap">{paymentMethods}</p></div>}
                    </div>
                )}
                <div className="text-center text-gray-400 text-[7pt]">
                    <p>{companyContactInfo.join(' · ')}</p>
                </div>
            </footer>
        </div>
    );

    const BoldTemplate = () => (
      <div className="bg-white font-sans text-[9pt]">
        <header 
          // Reduced padding from p-10 to p-8
          className="p-8 text-white relative bg-cover bg-center" 
          style={{ 
            backgroundColor: themeColor,
            backgroundImage: headerImage ? `linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2)), url(${headerImage})` : 'none'
          }}
        >
          <div className="relative z-10">
              <h2 className="text-4xl font-black tracking-tighter">COTIZACIÓN</h2>
              <p className="text-lg font-bold opacity-90">{quotationNumber}</p>
          </div>
        </header>
        <div className="p-6"> {/* Reduced from p-10 */}
            <section className="grid grid-cols-2 gap-8 mb-6">
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">DE:</p>
                    {companyLogo && <img src={companyLogo} alt="Logo" className="max-h-12 my-2 object-contain" />}
                    <h3 className="text-xl font-bold">{companyName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{companyAddress}</p>
                    <p className="text-sm text-gray-600">{companyPhone}</p>
                    <p className="text-sm text-gray-600">{companyEmail}</p>
                </div>
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">PARA:</p>
                    <h3 className="text-xl font-bold">{clientName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{clientPhone}</p>
                 </div>
            </section>
            
            <ItemsTable headerBgColor="#1F2937" headerTextColor="#F9FAFB" />
            
            <section className="mt-6">
              <div className="flex justify-end">
                  <SummarySection borderColor="gray-200" totalBorderColor={themeColor} />
              </div>
            </section>
             
            <footer className="mt-6 pt-3 border-t border-gray-100 text-[7.5pt] text-gray-500">
                {(paymentTerms || paymentMethods) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {paymentTerms && <div><h4 className="font-semibold text-gray-600 mb-0.5 uppercase tracking-wider text-[7pt]">Términos:</h4><p className="whitespace-pre-wrap">{paymentTerms}</p></div>}
                        {paymentMethods && <div><h4 className="font-semibold text-gray-600 mb-0.5 uppercase tracking-wider text-[7pt]">Métodos de Pago:</h4><p className="whitespace-pre-wrap">{paymentMethods}</p></div>}
                    </div>
                )}
            </footer>
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
