import { QuotationItem } from '../types';

// Define la estructura de los datos que se esperan del flujo de n8n
interface N8nResponseData {
  cliente?: string;
  productos?: any[];
  // ...otros campos que pueda devolver tu flujo
}

interface N8nWebhookResponse {
  success: boolean;
  data?: N8nResponseData;
  error?: string;
  // ...otros metadatos que pueda devolver tu flujo
}

export interface ExtractedData {
  items: QuotationItem[];
  clientName?: string;
}


// -----------------------------------------------------------------------------
// ¡IMPORTANTE! Reemplaza la siguiente URL con la URL de tu webhook de n8n.
// La obtienes del nodo "Webhook" en el flujo que te proporcioné.
// -----------------------------------------------------------------------------
const N8N_WEBHOOK_URL = 'https://webhook.red51.site/webhook/process-quote-ai';


export const extractItemsFromFile = async (file: File): Promise<ExtractedData> => {
  // FIX: This check for a placeholder URL was causing a TypeScript error because the URL is already configured,
  // making the comparison always false. The check has been removed.
  
  console.log(`Iniciando subida al webhook de n8n: ${N8N_WEBHOOK_URL}`);
  console.log(`Detalles del archivo a enviar:`, {
    name: file.name,
    size: file.size,
    type: file.type,
  });
  
  const formData = new FormData();
  // El nombre 'file' es crucial. n8n lo buscará con este nombre.
  formData.append('file', file, file.name);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("La respuesta del webhook de n8n no fue exitosa:", response.status, errorBody);
      throw new Error(`Error del servicio de procesamiento: ${response.statusText}`);
    }

    const result: N8nWebhookResponse = await response.json();
    console.log("Datos recibidos desde n8n:", result);

    if (result.success && result.data) {
      const items = (result.data.productos || []).map((item: any, index: number) => ({
        id: `item-${Date.now()}-${index}`,
        description: typeof item.descripcion === 'string' ? item.descripcion : 'Sin descripción',
        quantity: typeof item.cantidad === 'number' ? item.cantidad : 1,
        unitPrice: typeof item.precio_unitario === 'number' ? item.precio_unitario : 0,
      }));

      return {
        items,
        clientName: result.data.cliente || '',
      };
    } else {
      console.warn("La extracción de n8n no fue exitosa o los datos no tienen el formato esperado.", result);
      throw new Error(result.error || "La IA no pudo procesar la información del documento.");
    }

  } catch (error) {
    console.error("Error al llamar al webhook de n8n:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("No se pudieron extraer los datos. El servicio de procesamiento no está disponible o no respondió correctamente.");
  }
};