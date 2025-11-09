import React, { useState, useEffect, useRef } from 'react';
import { QuotationItem, MarginType, Template, Settings, User, PaymentOption } from '../types';
import FileUpload from '../components/FileUpload';
import QuotationEditor from '../components/QuotationEditor';
import QuotationPreview from '../components/QuotationPreview';
import Spinner from '../components/Spinner';
import { extractItemsFromFile } from '../services/geminiService';
import { Edit, RefreshCw, User as UserIcon, Download, MessageSquare, Info } from 'lucide-react';
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
    
    const [selectedTermId, setSelectedTermId] = useState<string>('');
    const [customTerm, setCustomTerm] = useState('');
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [customMethod, setCustomMethod] = useState('');

    const [whatsAppMessage, setWhatsAppMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
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
        paymentTerms: [],
        paymentMethods: [],
        quotationPrefix: 'COT-',
        quotationNextNumber: 1,
        themeColor: '#EC4899',
        headerImage: null,
    });
    
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const baseSubtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const total = marginType === MarginType.FIXED ? baseSubtotal + marginValue : baseSubtotal * (1 + marginValue / 100);
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
                        paymentTerms: [],
                        paymentMethods: [],
                    },
                    ...parsedSettings,
                };
                setSettings(completeSettings);
                setMarginType(completeSettings.defaultMarginType);
                setMarginValue(completeSettings.defaultMarginValue);

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
        if(clientName && total > 0) {
            const message = `Hola ${clientName}, te envío la cotización ${currentQuotationNumber} de ${settings.companyName}.\n\nEl total es de ${settings.currencySymbol} ${total.toFixed(2)}.\n\nQuedo a tu disposición para cualquier consulta. ¡Saludos!`;
            setWhatsAppMessage(message);
        } else {
            setWhatsAppMessage('');
        }
    }, [clientName, total, settings.companyName, settings.currencySymbol, currentQuotationNumber]);

    const finalizeAndIncrementQuoteNumber = () => {
        if (hasBeenFinalized) return;

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
            const extractedItems = await extractItemsFromFile(file);
            if (extractedItems.length === 0) {
                setError("No se encontraron productos en el archivo. Por favor, intenta con un documento más claro o crea la cotización manualmente.");
                setIsLoading(false);
                return;
            }
            setItems(extractedItems);
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
        setClientName('');
        setClientPhone('');
        
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
        })
        .catch(err => {
            console.error("Error generating PDF:", err);
            alert("Hubo un problema al generar el PDF. Por favor, intente de nuevo.");
        });
    };

    const handleSendWhatsApp = () => {
        if (!clientPhone || !whatsAppMessage) {
            alert("Por favor, ingresa el número de teléfono del cliente y un mensaje.");
            return;
        }
        finalizeAndIncrementQuoteNumber(); // Increment number on send as well
        const phoneNumber = clientPhone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(whatsAppMessage);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(url, '_blank');
    };
    
    const inputClasses = "w-full px-4 py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary text-textPrimary dark:text-dark-textPrimary";
    const textareaClasses = `${inputClasses} min-h-[100px] resize-y`;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
            {isLoading && <Spinner message="Analizando documento con IA..." />}
            
            {step === 1 && (
                <div className="max-w-xl mx-auto">
                     <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary">Crea una Nueva Cotización</h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">Empieza subiendo un documento o creando uno desde cero.</p>
                     </div>

                    {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg relative mb-6" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    <div className="space-y-6">
                        <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
                        <div className="relative flex items-center">
                            <div className="flex-grow border-t border-border dark:border-dark-border"></div>
                            <span className="flex-shrink mx-4 text-sm text-textSecondary dark:text-dark-textSecondary">O</span>
                            <div className="flex-grow border-t border-border dark:border-dark-border"></div>
                        </div>
                         <button
                            onClick={handleManualCreation}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-semibold text-textPrimary dark:text-dark-textPrimary bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            <Edit size={18} className="text-accent-teal" />
                            Crear Cotización Manualmente
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="max-w-4xl mx-auto">
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
                            />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4 flex items-center gap-2"><UserIcon size={20} className="text-accent-teal"/> 2. Ingresa los Datos del Cliente</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input 
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Nombre del Cliente"
                                />
                                <input 
                                    type="text"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Teléfono (ej. 519...)"
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
                            <h3 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4">4. Genera y Envía</h3>
                             <div className="space-y-4">
                                <div className="bg-green-500/10 p-4 rounded-lg space-y-3">
                                    <label htmlFor="whatsapp-message" className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                                        <MessageSquare size={16}/> Asistente de Envío por WhatsApp
                                    </label>
                                    <textarea 
                                        id="whatsapp-message"
                                        value={whatsAppMessage}
                                        onChange={(e) => setWhatsAppMessage(e.target.value)}
                                        className={`${textareaClasses} bg-white dark:bg-dark-surface`}
                                        placeholder="Mensaje para el cliente..."
                                    />
                                    <button
                                        onClick={handleSendWhatsApp}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={items.length === 0 || !clientName || !clientPhone}
                                    >
                                        Enviar
                                    </button>
                                </div>
                                
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full flex items-center justify-center gap-2 text-center px-4 py-3 text-sm font-semibold text-accent-teal bg-accent-teal/10 rounded-lg hover:bg-accent-teal/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={items.length === 0 || !clientName}
                                >
                                    <Download size={16} />
                                    Descargar solo el PDF
                                </button>
                            </div>
                        </div>
                    </div>

                     {/* Hidden Preview for PDF Generation */}
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
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewQuotePage;