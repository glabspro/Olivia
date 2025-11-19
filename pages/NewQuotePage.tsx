
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuotationItem, MarginType, Template, Settings, User, PaymentOption, TaxType } from '../types';
import QuotationEditor from '../components/QuotationEditor';
import QuotationPreview from '../components/QuotationPreview';
import Spinner from '../components/Spinner';
import { extractItemsFromFile } from '../services/geminiService';
import { saveQuotation } from '../services/supabaseClient';
import { Edit, RefreshCw, User as UserIcon, Download, MessageSquare, Info, Percent, FileUp, Eye, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface NewQuotePageProps {
    user: User;
}

const NewQuotePage: React.FC<NewQuotePageProps> = ({ user }) => {
    const [step, setStep] = useState(1);
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [marginType, setMarginType] = useState<MarginType>(MarginType.PERCENTAGE);
    const [marginValue, setMarginValue] = useState<number>(20);
    const [hasBeenFinalized, setHasBeenFinalized] = useState(false);

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    
    const [selectedTermId, setSelectedTermId] = useState<string>('');
    const [customTerm, setCustomTerm] = useState('');
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [customMethod, setCustomMethod] = useState('');

    const [taxType, setTaxType] = useState<TaxType>(TaxType.INCLUDED);
    const [taxRate, setTaxRate] = useState<number>(18);

    const [whatsAppMessage, setWhatsAppMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const [settings, setSettings] = useState<Settings>({
        companyName: user.companyName,
        companyLogo: null,
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        companyDocumentType: '',
        companyDocumentNumber: '',
        currencySymbol: 'S/',
        defaultMarginType: MarginType.PERCENTAGE,
        defaultMarginValue: 20,
        defaultTemplate: Template.MODERN,
        paymentTerms: [
            { id: 'term-cash', name: 'Contado', details: 'Pago al 100% contra entrega del producto o servicio.' },
            { id: 'term-credit', name: 'Crédito 15 Días', details: 'Crédito a 15 días calendario. Requiere orden de compra aprobada.' }
        ],
        paymentMethods: [
            { id: 'method-bcp', name: 'Transferencia BCP', details: 'Banco de Crédito del Perú (BCP)\nCuenta Soles: 191-XXXXXXXX-0-XX\nCCI: 002-191-XXXXXXXXXXXX-XX\nTitular: Mi Empresa S.A.C.' },
            { id: 'method-wallet', name: 'Yape / Plin', details: 'Número: 999 999 999\nTitular: Nombre del Titular\n(Enviar constancia al WhatsApp)' }
        ],
        quotationPrefix: 'COT-',
        quotationNextNumber: 1,
        themeColor: '#EC4899',
        headerImage: null,
        taxType: TaxType.INCLUDED,
        taxRate: 18,
    });
    
    // Ref for the hidden container used for generation (high quality)
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    
    const baseSubtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const totalWithMargin = marginType === MarginType.FIXED ? baseSubtotal + marginValue : baseSubtotal * (1 + marginValue / 100);
    const finalTotal = taxType === TaxType.ADDED ? totalWithMargin * (1 + taxRate / 100) : totalWithMargin;
    const currentQuotationNumber = `${settings.quotationPrefix}${String(settings.quotationNextNumber).padStart(4, '0')}`;


    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(`oliviaSettings_${user.id}`);
            if (savedSettings) {
                let parsedSettings = JSON.parse(savedSettings);

                // Backward compatibility for payment options
                if (typeof parsedSettings.paymentTerms === 'string') {
                    parsedSettings.paymentTerms = parsedSettings.paymentTerms ? [{ id: 'migrated-term', name: 'Predeterminado', details: parsedSettings.paymentTerms }] : [];
                } else if (!parsedSettings.paymentTerms) {
                    parsedSettings.paymentTerms = [];
                }
                if (typeof parsedSettings.paymentMethods === 'string') {
                    parsedSettings.paymentMethods = parsedSettings.paymentMethods ? [{ id: 'migrated-method', name: 'Predeterminado', details: parsedSettings.paymentMethods }] : [];
                } else if (!parsedSettings.paymentMethods) {
                    parsedSettings.paymentMethods = [];
                }

                const completeSettings = {
                    ...{ // Defaults for new fields
                        quotationPrefix: 'COT-',
                        quotationNextNumber: 1,
                        companyAddress: '',
                        companyPhone: '',
                        companyEmail: '',
                        companyWebsite: '',
                        companyDocumentType: '',
                        companyDocumentNumber: '',
                        themeColor: '#EC4899',
                        headerImage: null,
                        paymentTerms: [
                            { id: 'term-cash', name: 'Contado', details: 'Pago al 100% contra entrega del producto o servicio.' },
                            { id: 'term-credit', name: 'Crédito 15 Días', details: 'Crédito a 15 días calendario. Requiere orden de compra aprobada.' }
                        ],
                        paymentMethods: [
                            { id: 'method-bcp', name: 'Transferencia BCP', details: 'Banco de Crédito del Perú (BCP)\nCuenta Soles: 191-XXXXXXXX-0-XX\nCCI: 002-191-XXXXXXXXXXXX-XX\nTitular: Mi Empresa S.A.C.' },
                            { id: 'method-wallet', name: 'Yape / Plin', details: 'Número: 999 999 999\nTitular: Nombre del Titular\n(Enviar constancia al WhatsApp)' }
                        ],
                        taxType: TaxType.INCLUDED,
                        taxRate: 18,
                    },
                    ...parsedSettings,
                };
                setSettings(completeSettings);
                setMarginType(completeSettings.defaultMarginType);
                setMarginValue(completeSettings.defaultMarginValue);
                setTaxType(completeSettings.taxType);
                setTaxRate(completeSettings.taxRate);

                if (completeSettings.paymentTerms.length > 0) {
                    setSelectedTermId(completeSettings.paymentTerms[0].id);
                }
                if (completeSettings.paymentMethods.length > 0) {
                    setSelectedMethodId(completeSettings.paymentMethods[0].id);
                }
                
            } else {
                setSettings(prev => ({...prev, companyName: user.companyName}));
            }
        } catch (e) {
            console.error("Failed to load settings from localStorage", e);
        }
    }, [user.id, user.companyName]);
    
    const finalPaymentTerms = selectedTermId === 'other' 
        ? customTerm 
        : settings.paymentTerms.find(t => t.id === selectedTermId)?.details || '';

    const finalPaymentMethods = selectedMethodId === 'other'
        ? customMethod
        : settings.paymentMethods.find(m => m.id === selectedMethodId)?.details || '';

    useEffect(() => {
        if(clientName && finalTotal > 0) {
            const message = `Hola ${clientName}, te comparto la cotización ${currentQuotationNumber} de ${settings.companyName} por un total de ${settings.currencySymbol} ${finalTotal.toFixed(2)}. Adjunto el PDF con el detalle. Quedo a tu disposición para cualquier consulta. ¡Saludos!`;
            setWhatsAppMessage(message);
        } else {
            setWhatsAppMessage('');
        }
    }, [clientName, finalTotal, settings.companyName, settings.currencySymbol, currentQuotationNumber]);

    const saveToDatabase = async () => {
        if(hasBeenFinalized) return;
        
        try {
            console.log("Guardando en Supabase...");
            await saveQuotation(
                user.id, 
                { name: clientName, phone: clientPhone, email: clientEmail },
                { 
                    number: currentQuotationNumber, 
                    total: finalTotal, 
                    currency: settings.currencySymbol, 
                    items: items 
                }
            );
            console.log("Guardado exitoso.");
        } catch (err) {
            console.error("Error guardando en base de datos:", err);
            // No bloqueamos la UI si falla el guardado en BD, puede ser error de red o de permisos simulados
        }
    };

    const finalizeAndIncrementQuoteNumber = async () => {
        if (hasBeenFinalized) return;

        await saveToDatabase();

        const newSettings = {
            ...settings,
            quotationNextNumber: settings.quotationNextNumber + 1,
        };
        try {
            localStorage.setItem(`oliviaSettings_${user.id}`, JSON.stringify(newSettings));
            setSettings(newSettings);
            setHasBeenFinalized(true);
        } catch (e) {
            console.error("Failed to save incremented quote number", e);
        }
    };

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const { items: extractedItems, clientName: extractedClientName } = await extractItemsFromFile(file);
            if (extractedItems.length === 0) {
                setError("No se encontraron productos en el archivo. Por favor, intenta con un documento más claro o crea la cotización manualmente.");
                setIsLoading(false);
                return;
            }
            setItems(extractedItems);
            if (extractedClientName) {
                setClientName(extractedClientName);
            }
            setMarginType(settings.defaultMarginType);
            setMarginValue(settings.defaultMarginValue);
            setStep(2);
        } catch (e: any) {
            setError(e.message || "Ocurrió un error desconocido al procesar el archivo.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleManualCreation = () => {
        setItems([]);
        setError(null);
        setMarginType(settings.defaultMarginType);
        setMarginValue(settings.defaultMarginValue);
        setStep(2);
    };

    const resetState = () => {
        setStep(1);
        setItems([]);
        setMarginType(settings.defaultMarginType);
        setMarginValue(settings.defaultMarginValue);
        setTaxType(settings.taxType);
        setTaxRate(settings.taxRate);
        setClientName('');
        setClientPhone('');
        setClientEmail('');
        
        if (settings.paymentTerms.length > 0) {
            setSelectedTermId(settings.paymentTerms[0].id);
        } else {
            setSelectedTermId('');
        }
        setCustomTerm('');

        if (settings.paymentMethods.length > 0) {
            setSelectedMethodId(settings.paymentMethods[0].id);
        } else {
            setSelectedMethodId('');
        }
        setCustomMethod('');

        setWhatsAppMessage('');
        setError(null);
        setHasBeenFinalized(false);
    };

    const handleDownloadPDF = () => {
        const previewElement = pdfContainerRef.current;
        if (!previewElement) return;

        setIsLoading(true);
        html2canvas(previewElement, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
        })
        .then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Cotizacion_${currentQuotationNumber}_${clientName.replace(/ /g,"_") || 'cliente'}.pdf`);
            
            finalizeAndIncrementQuoteNumber();
            
            setIsLoading(false);
        })
        .catch(err => {
            console.error("Error generating PDF:", err);
            alert("Hubo un problema al generar el PDF. Por favor, intente de nuevo.");
            setIsLoading(false);
        });
    };

    const handleSendEmail = () => {
        const subject = `Cotización ${currentQuotationNumber} - ${settings.companyName}`;
        const body = `Estimado(a) ${clientName},\n\nAdjunto encontrarás la cotización solicitada.\n\n${whatsAppMessage}\n\nAtentamente,\n${settings.companyName}`;
        
        const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        finalizeAndIncrementQuoteNumber();
    };

    const handleSendToWebhook = async () => {
        if (!clientPhone || isSending || sentSuccess) return;

        setIsSending(true);

        try {
            const previewElement = pdfContainerRef.current;
            if (!previewElement) throw new Error("Preview element not found");

            const canvas = await html2canvas(previewElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            
            await finalizeAndIncrementQuoteNumber();

            const baseSubtotalCalc = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
            const totalWithMarginCalc = marginType === MarginType.FIXED ? baseSubtotalCalc + marginValue : baseSubtotalCalc * (1 + marginValue / 100);
            
            let subtotalForTax, igvAmount;
            if (taxType === TaxType.INCLUDED) {
                subtotalForTax = totalWithMarginCalc / (1 + taxRate / 100);
                igvAmount = totalWithMarginCalc - subtotalForTax;
            } else {
                subtotalForTax = totalWithMarginCalc;
                igvAmount = subtotalForTax * (taxRate / 100);
            }

            const payload = {
                client: { name: clientName, phone: clientPhone.replace(/\D/g, '') },
                company: {
                    name: settings.companyName,
                    document: `${settings.companyDocumentType || ''} ${settings.companyDocumentNumber || ''}`.trim(),
                },
                quote: {
                    number: currentQuotationNumber,
                    items: items,
                    subtotal: subtotalForTax,
                    tax: igvAmount,
                    total: finalTotal,
                    currency: settings.currencySymbol,
                    terms: finalPaymentTerms,
                    methods: finalPaymentMethods,
                    message: whatsAppMessage
                },
                pdfBase64: pdfBase64
            };

            console.log("--- SIMULANDO ENVÍO A N8N WEBHOOK ---");
            
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsSending(false);
            setSentSuccess(true);
            setTimeout(() => setSentSuccess(false), 3000);

        } catch (err) {
            console.error("Error sending to webhook:", err);
            alert("Hubo un problema al preparar los datos para el envío. Por favor, intente de nuevo.");
            setIsSending(false);
        }
    };
    
    // --- Drag and Drop Handlers ---
    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation();
    };
    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    }, [handleFileUpload]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    };


    const inputClasses = "w-full px-4 py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary text-textPrimary dark:text-dark-textPrimary";
    const textareaClasses = `${inputClasses} min-h-[100px] resize-y`;

    const sendButtonEnabled = items.length > 0 && clientName && clientPhone && !isSending && !sentSuccess;
    
    let buttonContent;
    if (sentSuccess) {
        buttonContent = (
            <>
                <CheckCircle size={24} />
                ¡Enviado con Éxito!
            </>
        );
    } else if (isSending) {
        buttonContent = (
            <>
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                Enviando...
            </>
        );
    } else {
        buttonContent = (
            <>
                <MessageSquare size={24} />
                Generar y Enviar por WhatsApp
            </>
        );
    }


    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
            {isLoading && <Spinner message="Procesando..." />}
            
            {step === 1 && (
                <div className="max-w-4xl mx-auto animate-fade-in">
                     <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary">Crea una Nueva Cotización</h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">Elige cómo quieres empezar. Importa un documento para que la IA haga el trabajo, o empieza desde cero.</p>
                     </div>

                    {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg relative mb-8" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Card 1: Import */}
                        <label 
                            htmlFor="file-upload"
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`flex flex-col text-center items-center justify-center p-8 bg-surface dark:bg-dark-surface rounded-xl border-2 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:-translate-y-1 ${isDragging ? 'border-primary dark:border-dark-primary shadow-lg scale-105' : 'border-dashed border-border dark:border-dark-border'}`}
                        >
                            <div className="p-4 bg-primary/10 rounded-full mb-4 transition-transform group-hover:scale-110">
                                <FileUp size={32} className="text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">Importar desde Documento</h3>
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary mt-1">Ideal para digitalizar cotizaciones. La IA extraerá los productos por ti.</p>
                            <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isLoading} accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx"/>
                        </label>
                        
                        {/* Card 2: Manual */}
                        <button
                            onClick={handleManualCreation}
                            disabled={isLoading}
                            className="flex flex-col text-center items-center justify-center p-8 bg-surface dark:bg-dark-surface rounded-xl border-2 border-border dark:border-dark-border transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 disabled:opacity-50"
                        >
                            <div className="p-4 bg-accent-teal/10 rounded-full mb-4 transition-transform group-hover:scale-110">
                                <Edit size={32} className="text-accent-teal" />
                            </div>
                            <h3 className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">Crear desde Cero</h3>
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary mt-1">Perfecto para cuando tienes la lista de productos y quieres control total.</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="max-w-4xl mx-auto animate-fade-in">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">Espacio de Trabajo</h2>
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary">Nro. de Cotización: <span className="font-semibold text-textPrimary dark:text-dark-textPrimary">{currentQuotationNumber}</span></p>
                        </div>
                         <button onClick={resetState} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-accent-coral bg-accent-coral/10 rounded-lg hover:bg-accent-coral/20 transition-colors">
                            <RefreshCw size={16} />
                            Empezar de nuevo
                        </button>
                    </div>
                    
                    <div className="bg-surface dark:bg-dark-surface rounded-lg p-4 md:p-6 border border-border dark:border-dark-border shadow-sm space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4">1. Edita los Productos</h3>
                            <QuotationEditor
                                items={items}
                                setItems={setItems}
                                marginType={marginType}
                                setMarginType={setMarginType}
                                marginValue={marginValue}
                                setMarginValue={setMarginValue}
                                currencySymbol={settings.currencySymbol}
                                taxType={taxType}
                                taxRate={taxRate}
                            />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4 flex items-center gap-2"><UserIcon size={20} className="text-accent-teal"/> 2. Datos del Cliente</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <input 
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Nombre del Cliente *"
                                />
                                <input 
                                    type="text"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Teléfono (ej. 987654321) *"
                                />
                                <input 
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Correo (Opcional)"
                                />
                            </div>
                        </div>

                         <div>
                            <h3 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4 flex items-center gap-2"><Info size={20} className="text-accent-yellow"/> 3. Define los Términos</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2">Términos de Pago</label>
                                    <select value={selectedTermId} onChange={(e) => setSelectedTermId(e.target.value)} className={inputClasses}>
                                        <option value="" disabled>Seleccionar...</option>
                                        {settings.paymentTerms.map(term => (
                                            <option key={term.id} value={term.id}>{term.name}</option>
                                        ))}
                                        <option value="other">Otro (personalizado)</option>
                                    </select>
                                    {selectedTermId === 'other' && (
                                        <textarea
                                            value={customTerm}
                                            onChange={(e) => setCustomTerm(e.target.value)}
                                            className={`${textareaClasses} mt-2`}
                                            placeholder="Escribe los términos personalizados..."
                                        />
                                    )}
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2">Métodos de Pago</label>
                                    <select value={selectedMethodId} onChange={(e) => setSelectedMethodId(e.target.value)} className={inputClasses}>
                                        <option value="" disabled>Seleccionar...</option>
                                        {settings.paymentMethods.map(method => (
                                            <option key={method.id} value={method.id}>{method.name}</option>
                                        ))}
                                        <option value="other">Otro (personalizado)</option>
                                    </select>
                                    {selectedMethodId === 'other' && (
                                        <textarea
                                            value={customMethod}
                                            onChange={(e) => setCustomMethod(e.target.value)}
                                            className={`${textareaClasses} mt-2`}
                                            placeholder="Escribe los métodos personalizados..."
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                             <h3 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4 flex items-center gap-2"><Percent size={20} className="text-accent-coral"/> 4. Ajusta los Impuestos</h3>
                            <div>
                                <label className="block text-sm font-medium text-textSecondary dark:text-dark-textSecondary mb-2">Configuración de IGV (para esta cotización)</label>
                                 <select value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)} className={inputClasses}>
                                    <option value={TaxType.INCLUDED}>Los precios ya incluyen IGV ({taxRate}%)</option>
                                    <option value={TaxType.ADDED}>Añadir IGV ({taxRate}%) al subtotal</option>
                                </select>
                            </div>
                        </div>

                         {/* Move to Preview Button */}
                         <div className="pt-6 border-t border-border dark:border-dark-border flex justify-end">
                            <button
                                onClick={() => setStep(3)}
                                disabled={items.length === 0 || !clientName || !clientPhone}
                                className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all duration-300 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center gap-2"
                            >
                                <Eye size={20} />
                                Continuar a Vista Previa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="max-w-7xl mx-auto animate-fade-in">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <button 
                                onClick={() => setStep(2)} 
                                className="flex items-center gap-2 text-textSecondary dark:text-dark-textSecondary hover:text-primary mb-2 text-sm"
                            >
                                <ArrowLeft size={16}/> Volver a Editar
                            </button>
                            <h2 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">Vista Previa</h2>
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary">Revisa que todo esté correcto antes de enviar.</p>
                        </div>
                         <button onClick={resetState} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-accent-coral bg-accent-coral/10 rounded-lg hover:bg-accent-coral/20 transition-colors">
                            <RefreshCw size={16} />
                            Nueva Cotización
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Live Preview Container */}
                        <div className="flex-1 order-2 lg:order-1 bg-gray-100 dark:bg-zinc-900 rounded-xl p-4 md:p-8 overflow-x-auto shadow-inner border border-border dark:border-dark-border">
                             <div className="min-w-[700px] md:min-w-full bg-white shadow-lg mx-auto max-w-[210mm] origin-top transform scale-95 md:scale-100">
                                <QuotationPreview
                                    items={items}
                                    marginType={marginType}
                                    marginValue={marginValue}
                                    clientName={clientName}
                                    clientPhone={clientPhone}
                                    companyName={settings.companyName}
                                    companyLogo={settings.companyLogo}
                                    companyAddress={settings.companyAddress}
                                    companyPhone={settings.companyPhone}
                                    companyEmail={settings.companyEmail}
                                    companyWebsite={settings.companyWebsite}
                                    companyDocumentType={settings.companyDocumentType}
                                    companyDocumentNumber={settings.companyDocumentNumber}
                                    currencySymbol={settings.currencySymbol}
                                    selectedTemplate={settings.defaultTemplate}
                                    paymentTerms={finalPaymentTerms}
                                    paymentMethods={finalPaymentMethods}
                                    quotationNumber={currentQuotationNumber}
                                    themeColor={settings.themeColor}
                                    headerImage={settings.headerImage}
                                    taxType={taxType}
                                    taxRate={taxRate}
                                />
                             </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="w-full lg:w-96 order-1 lg:order-2 space-y-6">
                            <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-md border border-border dark:border-dark-border sticky top-24">
                                <h3 className="font-bold text-lg text-textPrimary dark:text-dark-textPrimary mb-4">Opciones de Envío</h3>
                                
                                {/* WhatsApp Section */}
                                <div className="mb-6">
                                    <label className="text-xs font-semibold text-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-2 block">
                                        Mensaje (WhatsApp)
                                    </label>
                                    <textarea 
                                        value={whatsAppMessage}
                                        onChange={(e) => setWhatsAppMessage(e.target.value)}
                                        className={`${textareaClasses} text-sm h-24 mb-3`}
                                        placeholder="Mensaje para el cliente..."
                                    />
                                    <button
                                        onClick={handleSendToWebhook}
                                        disabled={!sendButtonEnabled}
                                        className={`group w-full flex items-center justify-center gap-3 px-4 py-4 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${sentSuccess ? 'bg-green-600' : 'bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-110 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'}`}
                                    >
                                        {buttonContent}
                                    </button>
                                </div>

                                <hr className="border-border dark:border-dark-border mb-6"/>

                                {/* Other Actions */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={!clientEmail}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!clientEmail ? "Ingresa un correo en el paso anterior" : "Abrir cliente de correo"}
                                    >
                                        <Mail size={20} />
                                        Enviar por Correo
                                    </button>

                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={items.length === 0}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-lg shadow hover:bg-pink-600 hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        <Download size={20} />
                                        Descargar PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* Hidden Preview for High-Res Generation */}
                    <div className="fixed top-0 left-[-9999px] w-[210mm] bg-white">
                        <div ref={pdfContainerRef}>
                            <QuotationPreview
                                items={items}
                                marginType={marginType}
                                marginValue={marginValue}
                                clientName={clientName}
                                clientPhone={clientPhone}
                                companyName={settings.companyName}
                                companyLogo={settings.companyLogo}
                                companyAddress={settings.companyAddress}
                                companyPhone={settings.companyPhone}
                                companyEmail={settings.companyEmail}
                                companyWebsite={settings.companyWebsite}
                                companyDocumentType={settings.companyDocumentType}
                                companyDocumentNumber={settings.companyDocumentNumber}
                                currencySymbol={settings.currencySymbol}
                                selectedTemplate={settings.defaultTemplate}
                                paymentTerms={finalPaymentTerms}
                                paymentMethods={finalPaymentMethods}
                                quotationNumber={currentQuotationNumber}
                                themeColor={settings.themeColor}
                                headerImage={settings.headerImage}
                                taxType={taxType}
                                taxRate={taxRate}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewQuotePage;
