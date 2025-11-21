
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuotationItem, MarginType, Template, Settings, User, PaymentOption, TaxType, DiscountType } from '../types';
import QuotationEditor from '../components/QuotationEditor';
import QuotationPreview from '../components/QuotationPreview';
import Spinner from '../components/Spinner';
import { extractItemsFromFile } from '../services/geminiService';
import { saveQuotation, updateQuotation, getMonthlyQuoteCount, incrementAIUsage, uploadQuotationPDF, getQuotationById, updateUserSettings } from '../services/supabaseClient';
import { Edit, RefreshCw, User as UserIcon, Download, MessageSquare, Info, Percent, FileUp, Eye, Mail, ArrowLeft, CheckCircle, Lock, AlertCircle, Sparkles, Smartphone, Bot, Zap, Share2, Save, Copy } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// URL del Webhook de n8n para el ENVÍO DE COTIZACIONES
const N8N_SEND_WHATSAPP_URL = 'https://webhook.red51.site/webhook/send-quote-whatsapp';
// URL del Webhook de n8n para el ENVÍO DE CORREOS (Brevo)
const N8N_SEND_EMAIL_URL = 'https://webhook.red51.site/webhook/send-quote-email';

interface NewQuotePageProps {
    user: User;
    quoteIdToEdit?: string | null;
    isDuplicating?: boolean;
    clearEditState?: () => void;
}

const NewQuotePage: React.FC<NewQuotePageProps> = ({ user, quoteIdToEdit, isDuplicating, clearEditState }) => {
    const [step, setStep] = useState(1);
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [marginType, setMarginType] = useState<MarginType>(MarginType.PERCENTAGE);
    const [marginValue, setMarginValue] = useState<number>(20);
    const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.AMOUNT);
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [hasBeenFinalized, setHasBeenFinalized] = useState(false);
    const [existingQuoteNumber, setExistingQuoteNumber] = useState<string | null>(null);

    // Internal state to track if we switched from creating new to editing the same draft
    const [internalQuoteId, setInternalQuoteId] = useState<string | null>(null);

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientDocument, setClientDocument] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    
    const [selectedTermId, setSelectedTermId] = useState<string>('');
    const [customTerm, setCustomTerm] = useState('');
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [customMethod, setCustomMethod] = useState('');

    const [taxType, setTaxType] = useState<TaxType>(TaxType.INCLUDED);
    const [taxRate, setTaxRate] = useState<number>(18);

    const [whatsAppMessage, setWhatsAppMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false); // State specifically for email
    const [sentSuccess, setSentSuccess] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState(false); // Success state for email
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Limit Logic
    const [quoteCount, setQuoteCount] = useState(0);
    const isFreePlan = user.permissions?.plan === 'free';
    const quoteLimit = 5;
    const limitReached = isFreePlan && quoteCount >= quoteLimit;
    
    // AI Limit Logic
    const aiUsageLimit = 2;
    const currentAiUsage = user.ai_usage_count || 0;
    const aiLimitReached = isFreePlan && currentAiUsage >= aiUsageLimit;

    // Determine if we are updating an existing quote
    const isEditing = (!!quoteIdToEdit || !!internalQuoteId) && !isDuplicating;
    const currentActiveQuoteId = quoteIdToEdit || internalQuoteId;

    // --- Load Existing Quote Logic ---
    useEffect(() => {
        const loadQuote = async () => {
            if (quoteIdToEdit) {
                setIsLoading(true);
                try {
                    const quoteData = await getQuotationById(quoteIdToEdit);
                    if (quoteData) {
                        setItems(quoteData.items);
                        setClientName(quoteData.client.name);
                        setClientPhone(quoteData.client.phone);
                        setClientEmail(quoteData.client.email || '');
                        setClientDocument(quoteData.client.document || '');
                        setClientAddress(quoteData.client.address || '');
                        
                        setDiscountValue(quoteData.discount || 0);
                        setDiscountType(quoteData.discountType || DiscountType.AMOUNT);
                        setExistingQuoteNumber(quoteData.number);
                        
                        if (isEditing) {
                            setStep(2);
                        } else {
                            setStep(2);
                        }
                    }
                } catch (e) {
                    console.error("Error loading quote", e);
                    setError("No se pudo cargar la cotización.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadQuote();
    }, [quoteIdToEdit, isEditing]);
    
    useEffect(() => {
        const checkLimits = async () => {
            const count = await getMonthlyQuoteCount(user.id);
            setQuoteCount(count);
        };
        checkLimits();
    }, [user.id]);

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
        quotationPadding: 6,
        themeColor: '#EC4899',
        headerImage: null,
        taxType: TaxType.INCLUDED,
        taxRate: 18,
    });
    
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    
    const baseSubtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const totalWithMargin = marginType === MarginType.FIXED ? baseSubtotal + marginValue : baseSubtotal * (1 + marginValue / 100);
    
    let discountAmount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
        discountAmount = totalWithMargin * (discountValue / 100);
    } else {
        discountAmount = discountValue;
    }
    const totalAfterDiscount = Math.max(0, totalWithMargin - discountAmount);

    const finalTotal = taxType === TaxType.ADDED ? totalAfterDiscount * (1 + taxRate / 100) : totalAfterDiscount;
    
    // Logic: Use existing number if editing, otherwise generate next number
    const currentQuotationNumber = (isEditing && existingQuoteNumber) 
        ? existingQuoteNumber 
        : `${settings.quotationPrefix}${String(settings.quotationNextNumber).padStart(settings.quotationPadding || 6, '0')}`;


    useEffect(() => {
        try {
            // PRIORITY 1: Load from Cloud Settings (User Profile)
            if (user.settings && Object.keys(user.settings).length > 0) {
                const cloudSettings = user.settings;
                
                if (!cloudSettings.paymentTerms) cloudSettings.paymentTerms = [];
                if (!cloudSettings.paymentMethods) cloudSettings.paymentMethods = [];

                setSettings(prev => ({ ...prev, ...cloudSettings }));
                setMarginType(cloudSettings.defaultMarginType);
                setMarginValue(cloudSettings.defaultMarginValue);
                setTaxType(cloudSettings.taxType);
                setTaxRate(cloudSettings.taxRate);

                // Also update LocalStorage to keep it in sync for next time
                localStorage.setItem(`oliviaSettings_${user.id}`, JSON.stringify(cloudSettings));

                if (cloudSettings.paymentTerms.length > 0) {
                    setSelectedTermId(cloudSettings.paymentTerms[0].id);
                }
                if (cloudSettings.paymentMethods.length > 0) {
                    setSelectedMethodId(cloudSettings.paymentMethods[0].id);
                }
                return; 
            }

            // PRIORITY 2: Fallback to LocalStorage
            const savedSettings = localStorage.getItem(`oliviaSettings_${user.id}`);
            if (savedSettings) {
                let parsedSettings = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsedSettings }));
                setMarginType(parsedSettings.defaultMarginType);
                setMarginValue(parsedSettings.defaultMarginValue);
                setTaxType(parsedSettings.taxType);
                setTaxRate(parsedSettings.taxRate);
            } else {
                setSettings(prev => ({...prev, companyName: user.companyName}));
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }, [user.id, user.companyName, user.settings]);
    
    const finalPaymentTerms = selectedTermId === 'other' 
        ? customTerm 
        : settings.paymentTerms.find(t => t.id === selectedTermId)?.details || '';

    const finalPaymentMethods = selectedMethodId === 'other'
        ? customMethod
        : settings.paymentMethods.find(m => m.id === selectedMethodId)?.details || '';

    useEffect(() => {
        if(clientName && finalTotal > 0) {
            const message = `Hola ${clientName}, te comparto la cotización de ${settings.companyName} por un total de ${settings.currencySymbol} ${finalTotal.toFixed(2)}. Adjunto el PDF con el detalle. Quedo a tu disposición para cualquier consulta. ¡Saludos!`;
            setWhatsAppMessage(message);
        } else {
            setWhatsAppMessage('');
        }
    }, [clientName, finalTotal, settings.companyName, settings.currencySymbol]);

    const saveToDatabase = async (status: 'draft' | 'sent' = 'sent') => {
        try {
            const clientData = { 
                name: clientName, 
                phone: clientPhone, 
                email: clientEmail, 
                address: clientAddress, 
                document: clientDocument 
            };
            
            if (isEditing && currentActiveQuoteId) {
                // UPDATE EXISTING
                await updateQuotation(
                    currentActiveQuoteId,
                    clientData,
                    { 
                        total: finalTotal, 
                        currency: settings.currencySymbol, 
                        items: items,
                        discount: discountValue,
                        discountType: discountType
                    },
                    status
                );
                console.log("Actualización exitosa.");
            } else {
                // INSERT NEW (or Duplicate)
                const newQuoteId = await saveQuotation(
                    user.id, 
                    clientData,
                    { 
                        number: currentQuotationNumber, 
                        total: finalTotal, 
                        currency: settings.currencySymbol, 
                        items: items,
                        discount: discountValue,
                        discountType: discountType
                    },
                    status
                );
                // Immediately switch to Edit mode for this new ID to prevent duplicates on re-save
                setInternalQuoteId(newQuoteId);
                setExistingQuoteNumber(currentQuotationNumber);
                console.log("Guardado exitoso. ID:", newQuoteId);
            }
        } catch (err) {
            console.error("Error guardando en base de datos:", err);
            throw err;
        }
    };

    const finalizeAndIncrementQuoteNumber = async () => {
        await saveToDatabase('sent');

        // Only increment number if this was a FRESH creation (not an edit of an old one)
        // AND if we haven't already finalized/incremented it in this session.
        if (!quoteIdToEdit && !hasBeenFinalized) {
            const newSettings = {
                ...settings,
                quotationNextNumber: settings.quotationNextNumber + 1,
            };
            try {
                // 1. Save to Cloud (Supabase) - CRITICAL for cross-device sync
                await updateUserSettings(user.id, newSettings);
                
                // 2. Update Local Cache
                localStorage.setItem(`oliviaSettings_${user.id}`, JSON.stringify(newSettings));
                setSettings(newSettings);
                
                // 3. Mark as finalized so we don't increment again for THIS specific quote
                setHasBeenFinalized(true);
                
                // Refresh count
                const count = await getMonthlyQuoteCount(user.id);
                setQuoteCount(count);
            } catch (e) {
                console.error("Failed to save incremented quote number", e);
            }
        }
    };

    const handleSaveDraft = async () => {
        if (!clientName || !clientPhone) {
             alert("Por favor ingresa al menos el Nombre y Teléfono del cliente para guardar el borrador.");
             return;
        }
        setIsLoading(true);
        try {
            await saveToDatabase('draft');
            
            // If it's new, we should also increment the number to reserve it for this draft
            if (!quoteIdToEdit && !hasBeenFinalized) {
                const newSettings = {
                    ...settings,
                    quotationNextNumber: settings.quotationNextNumber + 1,
                };
                await updateUserSettings(user.id, newSettings);
                localStorage.setItem(`oliviaSettings_${user.id}`, JSON.stringify(newSettings));
                setSettings(newSettings);
                setHasBeenFinalized(true);
            }
            
            const count = await getMonthlyQuoteCount(user.id);
            setQuoteCount(count);

            alert("Borrador guardado correctamente.");
            // Don't reset state, let them continue editing
        } catch (error) {
            console.error(error);
            alert("Hubo un error al guardar el borrador.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (aiLimitReached) {
            alert("Has agotado tus 2 usos gratuitos de IA. Por favor actualiza a PRO para acceso ilimitado.");
            return;
        }

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
            
            await incrementAIUsage(user.id);

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
        setDiscountType(DiscountType.AMOUNT);
        setDiscountValue(0);
        setTaxType(settings.taxType);
        setTaxRate(settings.taxRate);
        setClientName('');
        setClientPhone('');
        setClientEmail('');
        setClientDocument('');
        setClientAddress('');
        setExistingQuoteNumber(null);
        setInternalQuoteId(null);
        
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
        if (clearEditState) clearEditState();
    };

    const handleDownloadPDF = () => {
        if (limitReached && !isEditing) {
            alert(`Has alcanzado tu límite mensual de ${quoteLimit} cotizaciones en el plan Free.`);
            return;
        }

        const previewElement = pdfContainerRef.current;
        if (!previewElement) return;

        setIsLoading(true);
        // FIX: Force windowWidth to ensure desktop layout on mobile
        html2canvas(previewElement, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          windowWidth: 1200 
        })
        .then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Cotizacion_${clientName.replace(/ /g,"_") || 'cliente'}.pdf`);
            
            finalizeAndIncrementQuoteNumber();
            
            setIsLoading(false);
        })
        .catch(err => {
            console.error("Error generating PDF:", err);
            alert("Hubo un problema al generar el PDF. Por favor, intente de nuevo.");
            setIsLoading(false);
        });
    };

    const handleSendEmailViaWebhook = async () => {
        if (limitReached && !isEditing) {
             alert(`Has alcanzado tu límite mensual de ${quoteLimit} cotizaciones en el plan Free.`);
             return;
        }
        
        // Even if email is missing, we allow trying so user sees the validation
        // if (!clientEmail) {
        //     alert("Por favor, ingresa un correo electrónico válido para el cliente.");
        //     return;
        // }

        setIsLoading(true);
        setIsSendingEmail(true);

        try {
            const previewElement = pdfContainerRef.current;
            if (!previewElement) throw new Error("Preview element not found");

            // 1. Generate PDF
            const canvas = await html2canvas(previewElement, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                windowWidth: 1200 
            });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            const pdfBlob = pdf.output('blob');
            const fileName = `Cotizacion_${currentQuotationNumber}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            // 2. Upload PDF to Supabase
            const pdfUrl = await uploadQuotationPDF(file);
            if (!pdfUrl) throw new Error("No se pudo subir el PDF a la nube. Verifica los permisos (RLS) en Supabase.");
            
            await finalizeAndIncrementQuoteNumber();

            // 3. Prepare Payload for n8n (Email) with ROBUST FALLBACKS
            // Fallback order: Settings > User Profile > Generic Default
            const companyName = settings.companyName || user.companyName || 'Mi Empresa';
            const companyEmail = settings.companyEmail || user.email || 'no-reply@olivia.app'; 
            const companyAddress = settings.companyAddress || '';
            const companyPhone = settings.companyPhone || user.phone || '';

            const payload = {
                user_phone: user.phone.replace(/\D/g, ''),
                client: { name: clientName, email: clientEmail },
                company: {
                    name: companyName,
                    address: companyAddress,
                    phone: companyPhone,
                    email: companyEmail 
                },
                quote: {
                    number: currentQuotationNumber,
                    total: finalTotal,
                    currency: settings.currencySymbol,
                    message: whatsAppMessage // Reuse the friendly message logic
                },
                pdfUrl: pdfUrl
            };

            // 4. Send to n8n Webhook
            console.log("--- ENVIANDO A N8N EMAIL WEBHOOK ---", N8N_SEND_EMAIL_URL);
            const response = await fetch(N8N_SEND_EMAIL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Error del servidor de correo: ${response.status}`);
            }

            setEmailSuccess(true);
            setTimeout(() => setEmailSuccess(false), 4000);

        } catch (err: any) {
            console.error("Error sending email:", err);
            alert(`Error al enviar correo: ${err.message}`);
        } finally {
            setIsLoading(false);
            setIsSendingEmail(false);
        }
    };

    // --- Método Automático (Bot) ---
    const handleSendToWebhook = async () => {
        if (!clientPhone || isSending || sentSuccess) return;
        
        if (limitReached && !isEditing) {
             alert(`Has alcanzado tu límite mensual de ${quoteLimit} cotizaciones en el plan Free.`);
             return;
        }

        setIsLoading(true);
        setIsSending(true);

        try {
            const previewElement = pdfContainerRef.current;
            if (!previewElement) throw new Error("Preview element not found");

            // FIX: Force windowWidth
            const canvas = await html2canvas(previewElement, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                windowWidth: 1200 
            });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // Upload to Supabase Storage (Better way for n8n)
            const pdfBlob = pdf.output('blob');
            const fileName = `Cotizacion_${currentQuotationNumber}_${Date.now()}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            const pdfUrl = await uploadQuotationPDF(file);
            if (!pdfUrl) throw new Error("No se pudo subir el PDF a la nube. Verifica los permisos (RLS) en Supabase.");
            
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
                user_phone: user.phone.replace(/\D/g, ''),
                plan: user.permissions?.plan || 'free',
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
                // Send URL instead of huge Base64 string
                pdfUrl: pdfUrl,
                pdfBase64: null 
            };

            console.log("--- ENVIANDO A N8N WEBHOOK ---", N8N_SEND_WHATSAPP_URL);
            
            const response = await fetch(N8N_SEND_WHATSAPP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error(`Error Servidor n8n (${response.status}). Revisa las credenciales de Evolution API en n8n.`);
                }
                throw new Error(`Error del servidor: ${response.status}`);
            }

            setIsLoading(false);
            setIsSending(false);
            setSentSuccess(true);
            setTimeout(() => setSentSuccess(false), 3000);

        } catch (err: any) {
            console.error("Error sending to webhook:", err);
            
            // Specific CORS warning for user
            if (err.message === 'Failed to fetch') {
                 alert("Error de Conexión (CORS): n8n rechazó la conexión.\n\nSolución: Ve a tu Webhook en n8n > Node Options > Allowed Origins y pon '*'.");
            } else if (err.message.includes("No se pudo subir el PDF")) {
                 alert("Error de Permisos (Supabase): Ejecuta el script SQL para permitir subidas públicas en 'quotations'.");
            } else {
                 alert(`Problema al enviar: ${err.message}`);
            }

            setIsLoading(false);
            setIsSending(false);
        }
    };
    
    // --- Método Manual con Link (Redirección) ---
    const handleManualSendWithLink = async () => {
        if (!clientPhone || isSending || sentSuccess) return;
        setIsLoading(true);
        setIsSending(true);

        try {
            const previewElement = pdfContainerRef.current;
            if (!previewElement) throw new Error("Preview element not found");

            // FIX: Force windowWidth
            const canvas = await html2canvas(previewElement, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                windowWidth: 1200
            });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            const pdfBlob = pdf.output('blob');
            const fileName = `Cotizacion_${clientName.replace(/ /g,"_")}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            const publicUrl = await uploadQuotationPDF(file);
            if (!publicUrl) throw new Error("No se pudo generar el enlace público del PDF");

            await finalizeAndIncrementQuoteNumber();
            
            // Construct message safely for URL
            const message = `Hola *${clientName}*! 👋\n\nTe comparto la cotización solicitada, por un total de *${settings.currencySymbol} ${finalTotal.toFixed(2)}*.\n\nPuedes revisarla y descargarla en el siguiente enlace:\n\n📄 *Ver Cotización:*\n${publicUrl}\n\nQuedo atento a tus comentarios.\n*${settings.companyName}*`;
            
            const encodedMessage = encodeURIComponent(message);
            const cleanPhone = clientPhone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
            
            // Try to open
            const newWindow = window.open(whatsappUrl, '_blank');
            
            // Check if blocked
            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') { 
                alert("El navegador bloqueó la ventana de WhatsApp. Por favor, habilita las ventanas emergentes para este sitio o intenta de nuevo.");
            }
            
            setIsLoading(false);
            setIsSending(false);
            setSentSuccess(true);
            setTimeout(() => setSentSuccess(false), 3000);

        } catch (err: any) {
             console.error("Error manual send:", err);
             if (err.message && err.message.includes("Error Storage")) {
                alert(`Error de almacenamiento: ${err.message}. Revisa los permisos en Supabase.`);
             } else {
                alert("Error al generar el enlace. Verifica tu conexión.");
             }
             setIsLoading(false);
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
    const isPro = user.permissions?.plan === 'pro' || user.permissions?.plan === 'enterprise';
    
    const pageTitle = isEditing ? 'Editar Cotización' : isDuplicating ? 'Duplicar Cotización' : 'Nueva Cotización';

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full pb-40">
            {isLoading && <Spinner message={isSendingEmail ? "Enviando Correo..." : "Procesando..."} />}
            
            {step === 1 && (
                <div className="max-w-4xl mx-auto animate-fade-in">
                     <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary">{pageTitle}</h2>
                        <p className="text-textSecondary dark:text-dark-textSecondary mt-2">Elige cómo quieres empezar.</p>
                        {isFreePlan && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-sm text-textSecondary border border-border">
                                <span>Cotizaciones este mes: <strong>{quoteCount} / {quoteLimit}</strong></span>
                            </div>
                        )}
                     </div>
                     
                     {limitReached && !isEditing && (
                         <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 mb-8">
                             <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                             <div>
                                 <h4 className="font-bold text-red-600 dark:text-red-400">Límite Mensual Alcanzado</h4>
                                 <p className="text-sm text-red-500 dark:text-red-300">Has llegado al máximo de {quoteLimit} cotizaciones gratuitas. Actualiza a PRO para ilimitadas.</p>
                             </div>
                         </div>
                     )}

                    {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg relative mb-8" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Card 1: Import (AI) */}
                        <label 
                            htmlFor="file-upload"
                            onClick={(e) => {
                                if (aiLimitReached) {
                                    e.preventDefault();
                                    alert("Has agotado tus 2 usos gratuitos de IA. Actualiza a PRO.");
                                }
                            }}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`flex flex-col text-center items-center justify-center p-8 bg-surface dark:bg-dark-surface rounded-xl border-2 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:-translate-y-1 ${isDragging ? 'border-primary dark:border-dark-primary shadow-lg scale-105' : 'border-dashed border-border dark:border-dark-border'} ${aiLimitReached ? 'opacity-75' : ''}`}
                        >
                            <div className="absolute top-4 right-4">
                                {isFreePlan ? (
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${aiLimitReached ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {aiLimitReached ? <span className="flex items-center gap-1"><Lock size={10}/> 0/2 Usos</span> : <span className="flex items-center gap-1"><Sparkles size={10}/> {currentAiUsage}/2 Gratis</span>}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold bg-primary text-white px-2 py-1 rounded-full">ILIMITADO</span>
                                )}
                            </div>
                            <div className={`p-4 rounded-full mb-4 transition-transform group-hover:scale-110 ${aiLimitReached ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                <FileUp size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">Importar desde Documento (IA)</h3>
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary mt-1">Ideal para digitalizar cotizaciones automáticamente.</p>
                            <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isLoading || aiLimitReached} accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx"/>
                        </label>
                        
                        {/* Card 2: Manual */}
                        <button
                            onClick={handleManualCreation}
                            disabled={isLoading || (limitReached && !isEditing)}
                            className={`flex flex-col text-center items-center justify-center p-8 bg-surface dark:bg-dark-surface rounded-xl border-2 border-border dark:border-dark-border transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:shadow-none`}
                        >
                            <div className="p-4 bg-accent-teal/10 rounded-full mb-4 transition-transform group-hover:scale-110">
                                <Edit size={32} className="text-accent-teal" />
                            </div>
                            <h3 className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">
                                {isEditing ? 'Editar Datos Manualmente' : 'Crear desde Cero'}
                            </h3>
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary mt-1">Perfecto para cuando tienes la lista de productos y quieres control total.</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Steps 2 & 3 */}
            {step === 2 && (
                <div className="max-w-4xl mx-auto animate-fade-in">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                                {isEditing ? <Edit className="text-accent-teal"/> : <FileUp className="text-accent-teal"/>}
                                {pageTitle}
                            </h2>
                            <p className="text-sm text-textSecondary dark:text-dark-textSecondary">
                                {isEditing ? 'Modificando cotización existente.' : `Nro. de Cotización: ${currentQuotationNumber}`}
                            </p>
                        </div>
                         <button onClick={resetState} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-accent-coral bg-accent-coral/10 rounded-lg hover:bg-accent-coral/20 transition-colors">
                            <RefreshCw size={16} />
                            Limpiar / Nueva
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
                                discountType={discountType}
                                setDiscountType={setDiscountType}
                                discountValue={discountValue}
                                setDiscountValue={setDiscountValue}
                                currencySymbol={settings.currencySymbol}
                                taxType={taxType}
                                taxRate={taxRate}
                            />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary mb-4 flex items-center gap-2"><UserIcon size={20} className="text-accent-teal"/> 2. Datos del Cliente</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                    type="text"
                                    value={clientDocument}
                                    onChange={(e) => setClientDocument(e.target.value)}
                                    className={inputClasses}
                                    placeholder="RUC / DNI (Opcional)"
                                />
                                <input 
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Correo (Opcional)"
                                />
                                <input 
                                    type="text"
                                    value={clientAddress}
                                    onChange={(e) => setClientAddress(e.target.value)}
                                    className={`${inputClasses} sm:col-span-2`}
                                    placeholder="Dirección (Opcional)"
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

                         {/* Action Buttons Step 2 */}
                         <div className="pt-6 border-t border-border dark:border-dark-border flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button
                                onClick={handleSaveDraft}
                                disabled={!clientName}
                                className="w-full sm:w-auto px-6 py-4 border border-border dark:border-dark-border text-textSecondary dark:text-dark-textSecondary font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isEditing ? 'Guardar Cambios' : 'Guardar Borrador'}
                            </button>
                            
                            <button
                                onClick={() => setStep(3)}
                                disabled={items.length === 0 || !clientName || !clientPhone}
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all duration-300 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center justify-center gap-2"
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
                             {/* Scale Transform for Mobile to fit A4 width (~800px) into screen width (~360px) */}
                             <div className="min-w-[700px] md:min-w-full bg-white shadow-lg mx-auto max-w-[210mm] origin-top-left transform scale-[0.45] sm:scale-75 md:scale-100">
                                <QuotationPreview
                                    items={items}
                                    marginType={marginType}
                                    marginValue={marginValue}
                                    discountType={discountType}
                                    discountValue={discountValue}
                                    clientName={clientName}
                                    clientPhone={clientPhone}
                                    clientAddress={clientAddress}
                                    clientDocument={clientDocument}
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
                                
                                <div className="space-y-4 mb-6">
                                    {/* Button 1: Auto Bot (Default) */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wide">Envío Automático</span>
                                            {isPro && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">MARCA BLANCA</span>}
                                        </div>
                                        <button
                                            onClick={handleSendToWebhook}
                                            disabled={!sendButtonEnabled || (limitReached && !hasBeenFinalized && !isEditing)}
                                            className={`group w-full flex items-center justify-center gap-3 px-4 py-4 text-white font-bold text-base rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${sentSuccess ? 'bg-green-600' : 'bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-110 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'}`}
                                        >
                                            {isSending ? (
                                                <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> Enviando...</>
                                            ) : sentSuccess ? (
                                                <><CheckCircle size={20} /> Enviado</>
                                            ) : (
                                                <><Bot size={20}/> {isPro ? 'Enviar Rápido (Bot)' : 'Generar y Enviar'}</>
                                            )}
                                        </button>
                                    </div>

                                    {/* Button 2: Manual Link (PRO Only) */}
                                    {isPro && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-semibold text-textSecondary uppercase tracking-wide">Envío Directo</span>
                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Zap size={10}/> PRO</span>
                                            </div>
                                            <button
                                                onClick={handleManualSendWithLink}
                                                disabled={!sendButtonEnabled || (limitReached && !hasBeenFinalized && !isEditing)}
                                                className="group w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gray-800 text-white font-bold text-base rounded-xl shadow-md transition-all duration-300 hover:bg-black hover:shadow-lg border-2 border-transparent hover:border-gray-600"
                                            >
                                                <Smartphone size={20} className="text-green-400"/>
                                                Enviar desde mi número
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!isPro && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <p className="text-xs text-center text-blue-800 dark:text-blue-300">
                                            🔒 <span className="font-bold">¿Quieres enviar desde tu propio número?</span> <br/>Actualiza a PRO para desbloquear el envío directo y quitar la publicidad.
                                        </p>
                                    </div>
                                )}

                                <hr className="border-border dark:border-dark-border my-6"/>

                                {/* Other Actions */}
                                <div className="space-y-3">
                                    {/* Save Draft/Changes Button */}
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={isSending}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background dark:bg-white/5 border border-border dark:border-dark-border text-textSecondary dark:text-dark-textSecondary font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <Save size={18} />
                                        {isEditing ? 'Guardar Cambios' : 'Guardar Borrador'}
                                    </button>

                                    <button
                                        onClick={handleSendEmailViaWebhook}
                                        disabled={isSendingEmail || emailSuccess || (limitReached && !hasBeenFinalized && !isEditing)}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 border font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                            emailSuccess 
                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800' 
                                            : 'bg-background dark:bg-white/5 border-border dark:border-dark-border text-textPrimary dark:text-dark-textPrimary hover:bg-gray-50 dark:hover:bg-white/10'
                                        }`}
                                        title={!clientEmail ? "Se solicitará el correo si no lo has ingresado" : "Enviar correo con PDF"}
                                    >
                                        {emailSuccess ? <CheckCircle size={18}/> : <Mail size={18} />}
                                        {emailSuccess ? 'Enviado' : isSendingEmail ? 'Enviando...' : 'Enviar por Correo'}
                                    </button>

                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={items.length === 0 || (limitReached && !hasBeenFinalized && !isEditing)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-lg shadow hover:bg-pink-600 hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download size={18} />
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
                                discountType={discountType}
                                discountValue={discountValue}
                                clientName={clientName}
                                clientPhone={clientPhone}
                                clientAddress={clientAddress}
                                clientDocument={clientDocument}
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
