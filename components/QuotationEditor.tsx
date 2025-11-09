import React from 'react';
import { QuotationItem, MarginType } from '../types';
import { Trash2, PlusCircle } from 'lucide-react';

interface QuotationEditorProps {
  items: QuotationItem[];
  setItems: React.Dispatch<React.SetStateAction<QuotationItem[]>>;
  marginType: MarginType;
  setMarginType: (type: MarginType) => void;
  marginValue: number;
  setMarginValue: (value: number) => void;
  currencySymbol?: string;
}

const QuotationEditor: React.FC<QuotationEditorProps> = ({
  items,
  setItems,
  marginType,
  setMarginType,
  marginValue,
  setMarginValue,
  currencySymbol = 'S/',
}) => {
  const handleItemChange = (id: string, field: keyof Omit<QuotationItem, 'id'>, value: string | number) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(newItems);
  };

  const addNewItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateFinalPrice = (item: QuotationItem): number => {
    const baseTotal = item.quantity * item.unitPrice;
    if (marginType === MarginType.PERCENTAGE) {
      return baseTotal * (1 + marginValue / 100);
    }
    return baseTotal;
  };
  
  const baseSubtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = marginType === MarginType.FIXED ? baseSubtotal + marginValue : baseSubtotal * (1 + marginValue / 100);

  const inputClasses = "w-full bg-transparent focus:ring-1 focus:ring-primary/50 rounded-md p-2 border-transparent focus:border-transparent focus:outline-none transition";

  return (
    <div className="w-full bg-surface dark:bg-dark-surface rounded-lg p-4 md:p-6 border border-border dark:border-dark-border shadow-sm">
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-textSecondary dark:text-dark-textSecondary">
          <thead className="text-xs text-textSecondary dark:text-dark-textSecondary uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Descripción</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold w-24">Cant.</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold w-32">P. Unitario</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold w-32">P. Final</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-dark-border">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-background dark:hover:bg-dark-background">
                <td className="px-4 py-1">
                  <input type="text" value={item.description} placeholder="Nuevo producto" onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className={inputClasses} />
                </td>
                <td className="px-4 py-1">
                  <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-center`} />
                </td>
                <td className="px-4 py-1">
                  <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-right`} />
                </td>
                <td className="px-4 py-2 text-right font-semibold text-textPrimary dark:text-dark-textPrimary">
                  {currencySymbol} {calculateFinalPrice(item).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-center">
                   <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20">
                      <Trash2 size={16} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-background dark:bg-dark-background rounded-lg p-4 border border-border dark:border-dark-border">
            <input 
              type="text" 
              value={item.description} 
              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
              className="w-full font-semibold text-textPrimary dark:text-dark-textPrimary bg-transparent p-1 -ml-1 mb-2 focus:ring-1 focus:ring-primary/50 rounded"
              placeholder="Descripción del producto"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-textSecondary dark:text-dark-textSecondary">Cant.</label>
                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputClasses} bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-center py-3 mt-1`} />
              </div>
              <div>
                <label className="text-xs text-textSecondary dark:text-dark-textSecondary">P. Unitario</label>
                <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={`${inputClasses} bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-right py-3 mt-1`} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border dark:border-dark-border flex justify-between items-center">
                <span className="text-sm font-semibold text-textPrimary dark:text-dark-textPrimary">
                  Total Item: {currencySymbol} {calculateFinalPrice(item).toFixed(2)}
                </span>
                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20">
                  <Trash2 size={18} />
                </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-start">
        <button
          onClick={addNewItem}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-secondary bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
        >
          <PlusCircle size={16} />
          Agregar Producto
        </button>
      </div>

      <div className="mt-6 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center gap-6 p-4 bg-background dark:bg-dark-background rounded-lg border border-border dark:border-dark-border">
        <div className="w-full md:w-auto">
          <label htmlFor="margin-type" className="text-md font-semibold text-textPrimary dark:text-dark-textPrimary mb-2 block">Ajustar Margen:</label>
          <div className="flex">
            <select
              id="margin-type"
              value={marginType}
              onChange={(e) => setMarginType(e.target.value as MarginType)}
              className="h-14 rounded-l-md bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-textPrimary dark:text-dark-textPrimary focus:border-primary focus:ring-primary/50"
            >
              <option value={MarginType.PERCENTAGE}>%</option>
              <option value={MarginType.FIXED}>{currencySymbol}</option>
            </select>
            <input
              type="number"
              value={marginValue}
              onChange={(e) => setMarginValue(parseFloat(e.target.value) || 0)}
              className="w-full h-14 text-lg rounded-r-md bg-surface dark:bg-dark-surface border-y border-r border-border dark:border-dark-border text-textPrimary dark:text-dark-textPrimary focus:border-primary focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="text-right w-full md:w-auto">
          <p className="text-textSecondary dark:text-dark-textSecondary">Subtotal: {currencySymbol} {baseSubtotal.toFixed(2)}</p>
          <p className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary">Total: {currencySymbol} {total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default QuotationEditor;
