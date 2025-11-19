import React, { useState, useEffect, useRef } from 'react';
import { User, Settings as SettingsType, MarginType, Template, QuotationItem, TaxType } from '../types';
import AppSettings from '../components/Settings';
import QuotationPreview from '../components/QuotationPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

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
        themeColor: '#EC4899',
        headerImage: null,
        taxType: TaxType.INCLUDED,
        taxRate: 18,
    });
    const [saveMessage, setSaveMessage] = useState('');
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(`oliviaSettings_${user.id}`);
            if (savedSettings) {
                let parsedSettings = JSON.parse(savedSettings);

                // Ensure backward compatibility with old settings objects
                if (typeof parsedSettings.paymentTerms === 'string') {
                    parsedSettings.paymentTerms = parsedSettings.paymentTerms ? [{ id: 'migrated-term', name: 'Predeterminado', details: parsedSettings.paymentTerms }] : [];
                }
                 if (typeof parsedSettings.paymentMethods === 'string') {
                    parsedSettings.paymentMethods = parsedSettings.paymentMethods ? [{ id: 'migrated-method', name: 'Predeterminado', details: parsedSettings.paymentMethods }] : [];
                }

                const completeSettings = {
                    ...{ // Defaults for new fields
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
                        companyAddress: '',
                        companyPhone: '',
                        companyEmail: '',
                        companyWebsite: '',
                        companyDocumentType: '',
                        companyDocumentNumber: '',
                        themeColor: '#EC4899',
                        headerImage: null,
                        taxType: TaxType.INCLUDED,
                        taxRate: 18,
                    },
                    ...parsedSettings,
                };
                setSettings(completeSettings);
            } else {
                setSettings(prev => ({...prev, companyName: user.companyName}));
            }
        } catch (e) {
            console.error("Failed to load settings from localStorage", e);
        }
    }, [user.id, user.companyName]);

    const handleSaveSettings = (newSettings: SettingsType) => {
        setSettings(newSettings);
        try {
            localStorage.setItem(`oliviaSettings_${user.id}`, JSON.stringify(newSettings));
            setSaveMessage('¡Configuración guardada!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (e) {
            console.error("Failed to save settings to localStorage", e);
            setSaveMessage('Error al guardar la configuración.');
        }
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

    const sampleQuotationNumber = `${settings.quotationPrefix}${String(settings.quotationNextNumber).padStart(4, '0')}`;

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
                            <AppSettings currentSettings={settings} onSave={handleSaveSettings} />
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
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-textPrimary text-background dark:bg-dark-textPrimary dark:text-dark-background px-6 py-3 rounded-lg shadow-lg animate-bounce">
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;