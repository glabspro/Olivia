
import React, { useState, useEffect, useRef } from 'react';
import { User, Settings as SettingsType, MarginType, Template, QuotationItem, TaxType } from '../types';
import AppSettings from '../components/Settings';
import QuotationPreview from '../components/QuotationPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { updateUserSettings, triggerTaskAutomation } from '../services/supabaseClient';

interface SettingsPageProps {
    user: User;
}

const sampleItems: QuotationItem[] = [
  { id: 'sample-1', description: 'Producto de Ejemplo A', quantity: 2, unitPrice: 150.00 },
  { id: 'sample-2', description: 'Servicio de Muestra B', quantity: 1, unitPrice: 300.50 },
  { id: 'sample-3', description: 'Ítem de Demostración C', quantity: 5, unitPrice: 25.25 },
];
const sampleClientName = "Cliente de Muestra S.A.C.";
const sampleClientPhone = "51987654321";
const sampleClientDocument = "20100100100";
const sampleClientAddress = "Av. Javier Prado 1234, Lima";


const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
    const [settings, setSettings] = useState<SettingsType>({
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
        quotationPadding: 6,
        themeColor: '#EC4899',
        headerImage: null,
        taxType: TaxType.INCLUDED,
        taxRate: 18,
    });
    const [saveMessage, setSaveMessage] = useState('');
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Try to load from Cloud (User Profile)
        if (user.settings && Object.keys(user.settings).length > 0) {
            setSettings(prev => ({ ...prev, ...user.settings }));
        } 
        // 2. Fallback to LocalStorage (Migration path)
        else {
            try {
                const savedSettings = localStorage.getItem(`oliviaSettings_${user.id}`);
                if (savedSettings) {
                    let parsedSettings = JSON.parse(savedSettings);
                    setSettings(prev => ({ ...prev, ...parsedSettings }));
                } else {
                    setSettings(prev => ({...prev, companyName: user.companyName}));
                }
            } catch (e) {
                console.error("Failed to load settings from localStorage", e);
            }
        }
    }, [user]);

    const handleSaveSettings = async (newSettings: SettingsType) => {
        setSettings(newSettings);
        setSaveMessage('Guardando...');
        
        // 1. Optimistic Local Save (Always works immediately)
        // This ensures the user isn't blocked by DB errors
        try {
            localStorage.setItem(`oliviaSettings_${user.id}`, JSON.stringify(newSettings));
            
            // Also update the main profile cache to keep the app consistent on reload
            const savedProfile = localStorage.getItem('olivia_simulated_profile');
            if (savedProfile) {
                const parsed = JSON.parse(savedProfile);
                if (parsed.id === user.id) {
                    parsed.settings = newSettings;
                    localStorage.setItem('olivia_simulated_profile', JSON.stringify(parsed));
                }
            }
        } catch (e) {
            console.error("Local storage error", e);
        }

        try {
            // 2. Try Save to Cloud (DB)
            await updateUserSettings(user.id, newSettings);
            setSaveMessage('¡Configuración guardada!');
        } catch (e: any) {
            console.error("Failed to save settings to cloud", e);
            
            // Helpful error messages for common issues
            if (e.message?.includes('row-level security') || e.message?.includes('Permiso denegado')) {
                 setSaveMessage('⚠️ Guardado localmente. (Error Permisos DB)');
            } else {
                 setSaveMessage('⚠️ Guardado localmente.');
            }
        }
        
        setTimeout(() => setSaveMessage(''), 3000);
    };
    
    const handleTestIntegration = async (currentSettings: SettingsType) => {
        if (!currentSettings.calComLink) {
            setSaveMessage('⚠️ Ingresa un link antes de probar');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }
        
        setSaveMessage('Enviando mensaje de prueba...');
        
        // Create a temporary user object with the settings being tested
        // This ensures we test the exact link present in the input, even if DB save failed
        const tempUser = { ...user, settings: currentSettings };
        
        try {
            await triggerTaskAutomation(tempUser, {
                type: 'meeting',
                description: 'MEET: Prueba de integración Cal.com',
                date: new Date().toISOString()
            });
            setSaveMessage('✅ ¡Enviado! Revisa tu WhatsApp.');
        } catch (e) {
            console.error(e);
            setSaveMessage('❌ Error al enviar prueba.');
        }
        
        setTimeout(() => setSaveMessage(''), 4000);
    };
    
    const handleDownloadSample = () => {
        const previewElement = previewRef.current;
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
            pdf.save(`Muestra_Cotizacion_${settings.defaultTemplate}.pdf`);
        })
        .catch(err => {
            console.error("Error generating PDF:", err);
            alert("Hubo un problema al generar el PDF de muestra.");
        });
    };

    const sampleQuotationNumber = `${settings.quotationPrefix}${String(settings.quotationNextNumber).padStart(settings.quotationPadding || 6, '0')}`;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                        Configuración y Diseño
                        <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-yellow rounded-full"></span>
                    </h2>
                    <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                        Ajusta los detalles de tu empresa y visualiza cómo se verá tu cotización final.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                         <div className="bg-surface dark:bg-dark-surface rounded-lg border border-border dark:border-dark-border p-6 shadow-sm">
                            <AppSettings 
                                currentSettings={settings} 
                                onSave={handleSaveSettings} 
                                onTestIntegration={handleTestIntegration}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="lg:sticky lg:top-24">
                            <div className="bg-gray-100 dark:bg-dark-background rounded-lg p-4 sm:p-8">
                                <div className="flex justify-between items-center mb-4">
                                     <p className="text-sm font-semibold text-textSecondary dark:text-dark-textSecondary uppercase tracking-wider">Previsualización en Vivo</p>
                                     <button 
                                        onClick={handleDownloadSample}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-accent-teal bg-accent-teal/10 rounded-lg hover:bg-accent-teal/20 transition-colors"
                                    >
                                        <Download size={14} />
                                        Descargar Muestra
                                     </button>
                                </div>
                                 <div className="shadow-lg" ref={previewRef}>
                                    <QuotationPreview
                                        items={sampleItems}
                                        marginType={settings.defaultMarginType}
                                        marginValue={settings.defaultMarginValue}
                                        currencySymbol={settings.currencySymbol}
                                        clientName={sampleClientName}
                                        clientPhone={sampleClientPhone}
                                        clientAddress={sampleClientAddress}
                                        clientDocument={sampleClientDocument}
                                        companyName={settings.companyName}
                                        companyLogo={settings.companyLogo}
                                        companyAddress={settings.companyAddress}
                                        companyPhone={settings.companyPhone}
                                        companyEmail={settings.companyEmail}
                                        companyWebsite={settings.companyWebsite}
                                        companyDocumentType={settings.companyDocumentType}
                                        companyDocumentNumber={settings.companyDocumentNumber}
                                        selectedTemplate={settings.defaultTemplate}
                                        paymentTerms={settings.paymentTerms.map(p => p.details).join('\n\n')}
                                        paymentMethods={settings.paymentMethods.map(p => p.details).join('\n\n')}
                                        quotationNumber={sampleQuotationNumber}
                                        themeColor={settings.themeColor}
                                        headerImage={settings.headerImage}
                                        taxType={settings.taxType}
                                        taxRate={settings.taxRate}
                                    />
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {saveMessage && (
                    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg animate-bounce z-50 border transition-colors ${
                        saveMessage.includes('Error') || saveMessage.includes('⚠️')
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-textPrimary text-background dark:bg-dark-textPrimary dark:text-dark-background border-border'
                    }`}>
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
