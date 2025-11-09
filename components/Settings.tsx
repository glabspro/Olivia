import React, { useState, useRef, useEffect } from 'react';
import { Settings, MarginType, Template, PaymentOption } from '../types';
import { Upload, Building, Hash, Palette, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react';

interface SettingsProps {
  currentSettings: Settings;
  onSave: (newSettings: Settings) => void;
}

const templatePreviews = (themeColor: string) => ({
    [Template.MODERN]: {
        name: 'Moderno',
        component: (
            <div className="w-full h-24 rounded border-2 border-gray-300 p-2 flex flex-col bg-white">
                <div className="h-4 w-1/2 bg-gray-800 rounded-sm"></div>
                <div className="flex-grow space-y-1.5 mt-2 py-1">
                    <div className="h-2 w-full bg-gray-200 rounded"></div>
                    <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 w-1/3 self-end rounded-sm" style={{backgroundColor: themeColor}}></div>
            </div>
        )
    },
    [Template.CLASSIC]: {
        name: 'Clásico',
        component: (
            <div className="w-full h-24 rounded border-2 border-gray-400 p-2 flex flex-col bg-white items-center font-serif">
                <div className="h-3 w-1/3 bg-gray-800 rounded-sm"></div>
                <div className="h-px w-full bg-gray-800 my-2"></div>
                <div className="flex-grow w-full space-y-1.5 py-1">
                    <div className="h-2 w-full bg-gray-300 rounded"></div>
                    <div className="h-2 w-5/6 bg-gray-300 rounded"></div>
                </div>
                 <div className="h-px w-1/2 bg-gray-800"></div>
            </div>
        )
    },
    [Template.MINIMALIST]: {
        name: 'Minimalista',
        component: (
            <div className="w-full h-24 rounded border-2 border-gray-200 p-2 flex flex-col bg-white">
                 <div className="h-2.5 w-1/2 bg-gray-600 rounded-sm self-start"></div>
                 <div className="flex-grow w-full space-y-1.5 py-1 mt-4">
                    <div className="h-1.5 w-full bg-gray-200 rounded"></div>
                    <div className="h-1.5 w-5/6 bg-gray-200 rounded"></div>
                 </div>
                 <div className="h-2 w-1/4 self-end bg-gray-700 rounded-sm"></div>
            </div>
        )
    },
    [Template.ELEGANT]: {
        name: 'Elegante',
        component: (
             <div className="w-full h-24 rounded border-2 border-gray-300 p-2 flex flex-col bg-white">
                <div className="h-4 w-2/3 bg-gray-800 rounded-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}></div>
                <div className="h-px w-full bg-gray-300 my-2"></div>
                <div className="flex-grow w-full space-y-1.5 py-1">
                    <div className="h-2 w-full bg-gray-200 rounded"></div>
                    <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                </div>
                <div className="h-2.5 w-1/3 self-end bg-gray-800 rounded-sm"></div>
            </div>
        )
    },
    [Template.BOLD]: {
        name: 'Audaz',
        component: (
            <div className="w-full h-24 rounded border-2 border-gray-300 flex flex-col bg-white overflow-hidden">
                <div className="h-8 w-full flex items-center p-2" style={{backgroundColor: themeColor}}>
                    <div className="h-4 w-1/2 bg-white/80 rounded-sm"></div>
                </div>
                 <div className="flex-grow w-full space-y-1.5 p-2">
                    <div className="h-2 w-full bg-gray-300 rounded"></div>
                    <div className="h-2 w-5/6 bg-gray-300 rounded"></div>
                </div>
                 <div className="h-6 w-1/2 self-end bg-gray-200 m-2 rounded-sm"></div>
            </div>
        )
    },
});

const AppSettings: React.FC<SettingsProps> = ({ currentSettings, onSave }) => {
  const [settings, setSettings] = useState<Settings>(currentSettings);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  // Auto-save on settings change with debounce
  useEffect(() => {
    if (JSON.stringify(settings) !== JSON.stringify(currentSettings)) {
        const handler = setTimeout(() => {
            onSave(settings);
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };
    }
  }, [settings, onSave, currentSettings]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Ensure number inputs are stored as numbers
    const isNumberInput = type === 'number';
    const parsedValue = isNumberInput ? parseFloat(value) || 0 : value;

    setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings(prev => ({ ...prev, companyLogo: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings(prev => ({ ...prev, headerImage: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };


  const handleTemplateChange = (template: Template) => {
    setSettings(prev => ({ ...prev, defaultTemplate: template }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  const handlePaymentOptionChange = (
    type: 'paymentTerms' | 'paymentMethods',
    index: number,
    field: 'name' | 'details',
    value: string
  ) => {
    setSettings(prev => {
        const newOptions = [...prev[type]];
        newOptions[index] = { ...newOptions[index], [field]: value };
        return { ...prev, [type]: newOptions };
    });
  };

  const addPaymentOption = (type: 'paymentTerms' | 'paymentMethods') => {
      setSettings(prev => ({
          ...prev,
          [type]: [
              ...prev[type],
              { id: `${type.slice(0, -1)}-${Date.now()}`, name: '', details: '' }
          ]
      }));
  };

  const removePaymentOption = (type: 'paymentTerms' | 'paymentMethods', index: number) => {
      setSettings(prev => ({
          ...prev,
          [type]: prev[type].filter((_, i) => i !== index)
      }));
  };

  const inputClasses = "w-full px-2.5 py-1.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary text-textPrimary dark:text-dark-textPrimary text-sm transition";
  const labelClasses = "block text-xs font-medium text-textSecondary dark:text-dark-textSecondary mb-1";
  const generatedTemplatePreviews = templatePreviews(settings.themeColor || '#EC4899');


  const PaymentOptionEditor = ({ label, options, type }: { label: string, options: PaymentOption[], type: 'paymentTerms' | 'paymentMethods' }) => (
    <div>
        <label className={labelClasses}>{label}</label>
        <div className="space-y-2 mt-2">
            {options.map((option, index) => (
                <div key={option.id} className="p-2 border border-border dark:border-dark-border rounded-lg bg-background dark:bg-dark-background space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Nombre (ej. Contado)"
                            value={option.name}
                            onChange={(e) => handlePaymentOptionChange(type, index, 'name', e.target.value)}
                            className={inputClasses}
                        />
                        <button type="button" onClick={() => removePaymentOption(type, index)} className="text-red-500 hover:text-red-400 p-1.5 rounded-full hover:bg-red-500/10 flex-shrink-0">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <textarea
                        placeholder="Detalles completos..."
                        value={option.details}
                        onChange={(e) => handlePaymentOptionChange(type, index, 'details', e.target.value)}
                        className={`${inputClasses} h-16`}
                    />
                </div>
            ))}
             <button type="button" onClick={() => addPaymentOption(type)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-accent-teal bg-accent-teal/10 rounded-lg hover:bg-accent-teal/20 transition-colors">
                <PlusCircle size={14} />
                Agregar Opción
            </button>
        </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company Details */}
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2 border-b border-border dark:border-dark-border pb-2">
                <Building size={18} className="text-accent-teal" />
                Datos de tu Empresa
            </h3>
            <div>
                <label htmlFor="companyName" className={labelClasses}>Nombre de la Empresa</label>
                <input type="text" id="companyName" name="companyName" value={settings.companyName} onChange={handleInputChange} className={inputClasses}/>
            </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="companyDocumentType" className={labelClasses}>Tipo de Documento</label>
                    <select id="companyDocumentType" name="companyDocumentType" value={settings.companyDocumentType || ''} onChange={handleInputChange} className={inputClasses}>
                        <option value="">Ninguno</option>
                        <option value="RUC">RUC</option>
                        <option value="DNI">DNI</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="companyDocumentNumber" className={labelClasses}>Nro. de Documento</label>
                    <input type="text" id="companyDocumentNumber" name="companyDocumentNumber" value={settings.companyDocumentNumber || ''} onChange={handleInputChange} className={inputClasses}/>
                </div>
            </div>
            <div>
                <label className={labelClasses}>Logo de la Empresa</label>
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-background dark:bg-dark-background rounded-md flex items-center justify-center overflow-hidden border border-border dark:border-dark-border">
                        {settings.companyLogo ? <img src={settings.companyLogo} alt="Company Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-center text-textSecondary dark:text-dark-textSecondary">Logo</span>}
                    </div>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*"/>
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-accent-teal bg-accent-teal/10 rounded-lg hover:bg-accent-teal/20 transition-colors">
                        <Upload size={14} />
                        Cambiar
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="companyAddress" className={labelClasses}>Dirección</label>
                <input type="text" id="companyAddress" name="companyAddress" value={settings.companyAddress || ''} onChange={handleInputChange} className={inputClasses}/>
            </div>
            <div>
                <label htmlFor="companyPhone" className={labelClasses}>Teléfono</label>
                <input type="text" id="companyPhone" name="companyPhone" value={settings.companyPhone || ''} onChange={handleInputChange} className={inputClasses}/>
            </div>
            <div>
                <label htmlFor="companyEmail" className={labelClasses}>Correo Electrónico</label>
                <input type="email" id="companyEmail" name="companyEmail" value={settings.companyEmail || ''} onChange={handleInputChange} className={inputClasses}/>
            </div>
            <div>
                <label htmlFor="companyWebsite" className={labelClasses}>Página Web</label>
                <input type="text" id="companyWebsite" name="companyWebsite" value={settings.companyWebsite || ''} onChange={handleInputChange} className={inputClasses}/>
            </div>
        </div>

        {/* Quotation Numbering */}
        <div className="space-y-3">
             <h3 className="text-lg font-semibold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2 border-b border-border dark:border-dark-border pb-2">
                <Hash size={18} className="text-accent-coral" />
                Numeración de Cotizaciones
            </h3>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                    <label htmlFor="quotationPrefix" className={labelClasses}>Prefijo</label>
                    <input type="text" id="quotationPrefix" name="quotationPrefix" value={settings.quotationPrefix} onChange={handleInputChange} className={inputClasses}/>
                </div>
                <div className="col-span-2">
                    <label htmlFor="quotationNextNumber" className={labelClasses}>Siguiente Número</label>
                    <input type="number" id="quotationNextNumber" name="quotationNextNumber" value={settings.quotationNextNumber} onChange={handleInputChange} className={inputClasses}/>
                </div>
            </div>
        </div>

        {/* Other Settings */}
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2 border-b border-border dark:border-dark-border pb-2">
                    <Palette size={18} className="text-primary" />
                    Diseño y Personalización
                </h3>
            </div>
            <div className="space-y-3">
                <div>
                    <label htmlFor="themeColor" className={labelClasses}>Color de la Marca</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            id="themeColor"
                            name="themeColor"
                            value={settings.themeColor}
                            onChange={handleInputChange}
                            className="w-10 h-10 p-0.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg cursor-pointer"
                        />
                         <input 
                            type="text"
                            value={settings.themeColor}
                            onChange={handleInputChange}
                            name="themeColor"
                            className={inputClasses + ' w-32'}
                            placeholder="#EC4899"
                        />
                    </div>
                </div>
                 <div>
                    <label className={labelClasses}>Banner de Cabecera (Opcional)</label>
                    <p className="text-xs text-textSecondary dark:text-dark-textSecondary mb-2">Ideal para plantillas como "Audaz". Recomendado: 800x200px.</p>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-32 bg-background dark:bg-dark-background rounded-md flex items-center justify-center overflow-hidden border border-border dark:border-dark-border">
                            {settings.headerImage ? <img src={settings.headerImage} alt="Header Banner" className="h-full w-full object-cover" /> : <ImageIcon size={24} className="text-textSecondary" />}
                        </div>
                        <input type="file" ref={headerInputRef} onChange={handleHeaderImageUpload} className="hidden" accept="image/*"/>
                        <button type="button" onClick={() => headerInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-accent-teal bg-accent-teal/10 rounded-lg hover:bg-accent-teal/20 transition-colors">
                            <Upload size={14} />
                            Subir
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <label className={labelClasses}>Diseño de Cotización por Defecto</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {Object.values(Template).map((templateId) => {
                    const template = generatedTemplatePreviews[templateId];
                    const isActive = settings.defaultTemplate === templateId;
                    return (
                        <button
                            type="button"
                            key={templateId}
                            onClick={() => handleTemplateChange(templateId)}
                            className={`text-center transition-all duration-200 rounded-lg p-1 ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface dark:ring-offset-dark-surface' : 'ring-0'}`}
                        >
                        {template.component}
                        <span className={`block text-xs font-semibold mt-2 ${isActive ? 'text-primary' : 'text-textSecondary'}`}>
                            {template.name}
                        </span>
                        </button>
                    );
                    })}
                </div>
            </div>
            
            <PaymentOptionEditor
                label="Términos de Pago (predefinidos)"
                options={settings.paymentTerms}
                type="paymentTerms"
            />
            <PaymentOptionEditor
                label="Métodos de Pago (predefinidos)"
                options={settings.paymentMethods}
                type="paymentMethods"
            />
            
            <div>
                <label htmlFor="currencySymbol" className={labelClasses}>Símbolo de Moneda</label>
                <input type="text" id="currencySymbol" name="currencySymbol" value={settings.currencySymbol} onChange={handleInputChange} className={inputClasses} placeholder="S/, $, €..."/>
            </div>
            <div>
                <label className={labelClasses}>Margen por Defecto</label>
                <div className="flex items-center">
                    <select
                    name="defaultMarginType"
                    value={settings.defaultMarginType}
                    onChange={handleInputChange}
                    className="rounded-l-md border border-gray-200 dark:border-dark-border shadow-sm px-2 py-1.5 bg-white dark:bg-dark-surface text-textPrimary dark:text-dark-textPrimary focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary text-sm"
                    >
                    <option value={MarginType.PERCENTAGE}>%</option>
                    <option value={MarginType.FIXED}>{settings.currencySymbol}</option>
                    </select>
                    <input
                    type="number"
                    name="defaultMarginValue"
                    value={settings.defaultMarginValue}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1.5 border-y border-r border-gray-200 dark:border-dark-border rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-white dark:bg-dark-surface text-textPrimary dark:text-dark-textPrimary text-sm"
                    />
                </div>
            </div>
        </div>
      
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

export default AppSettings;