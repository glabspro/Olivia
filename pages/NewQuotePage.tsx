import React, { useState, useEffect } from 'react';
import { QuotationItem, MarginType, Template, Settings, User } from '../types';
import FileUpload from '../components/FileUpload';
import QuotationEditor from '../components/QuotationEditor';
import QuotationPreview from '../components/QuotationPreview';
import Spinner from '../components/Spinner';
import { extractItemsFromFile } from '../services/geminiService';
import { Edit, RefreshCw } from 'lucide-react';
import WhatsAppButton from '../components/WhatsAppButton';

interface NewQuotePageProps {
    user: User;
}

const NewQuotePage: React.FC<NewQuotePageProps> = ({ user }) => {
    const [step, setStep] = useState(1); // 1: Initial, 2: Workspace
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [marginType, setMarginType] = useState<MarginType>(MarginType.PERCENTAGE);
    const [marginValue, setMarginValue] = useState<number>(20);

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedTemplate, setSelectedTemplate] = useState<Template>(Template.MODERN);
    
    const [settings, setSettings] = useState<Settings>({
        companyName: user.companyName,
        companyLogo: null,
        currencySymbol: 'S/',
        defaultMarginType: MarginType.PERCENTAGE,
        defaultMarginValue: 20,
    });

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(`oliviaSettings_${user.id}`);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings(parsedSettings);
                setMarginType(parsedSettings.defaultMarginType);
                setMarginValue(parsedSettings.defaultMarginValue);
            } else {
                setSettings(prev => ({...prev, companyName: user.companyName}));
            }
        } catch (e) {
            console.error("Failed to load settings from localStorage", e);
        }
    }, [user.id, user.companyName]);


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
        setError(null);
    };

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
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-semibold text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/20 rounded-lg hover:bg-primary/20 dark:hover:bg-dark-primary/20 transition-colors disabled:opacity-50"
                        >
                            <Edit size={18} />
                            Crear Cotización Manualmente
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">Espacio de Trabajo</h2>
                         <button onClick={resetState} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-textSecondary dark:text-dark-textSecondary bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg hover:bg-background dark:hover:bg-dark-border transition-colors">
                            <RefreshCw size={16} />
                            Empezar de nuevo
                        </button>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:gap-8">
                        {/* Editor Side */}
                        <div className="w-full lg:w-1/2 lg:h-[calc(100vh-190px)] lg:overflow-y-auto lg:pr-4 mb-8 lg:mb-0">
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
                        {/* Preview and Actions Side */}
                        <div className="w-full lg:w-1/2 lg:h-[calc(100vh-190px)] lg:overflow-y-auto">
                            <QuotationPreview
                                items={items}
                                marginType={marginType}
                                marginValue={marginValue}
                                clientName={clientName}
                                setClientName={setClientName}
                                clientPhone={clientPhone}
                                setClientPhone={setClientPhone}
                                companyName={settings.companyName}
                                companyLogo={settings.companyLogo}
                                currencySymbol={settings.currencySymbol}
                                selectedTemplate={selectedTemplate}
                                setSelectedTemplate={setSelectedTemplate}
                                ActionPanel={(
                                     <WhatsAppButton
                                        items={items}
                                        marginType={marginType}
                                        marginValue={marginValue}
                                        clientName={clientName}
                                        clientPhone={clientPhone}
                                        companyName={settings.companyName}
                                        currencySymbol={settings.currencySymbol}
                                        onSent={resetState}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewQuotePage;