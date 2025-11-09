import React from 'react';
import { History } from 'lucide-react';

const HistoryPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary">Historial de Cotizaciones</h2>
                    <p className="text-textSecondary dark:text-dark-textSecondary mt-1">
                        Aquí podrás ver todas las cotizaciones que has generado.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center h-96 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg shadow-sm">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <History size={32} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-textPrimary dark:text-dark-textPrimary">Próximamente</h3>
                    <p className="text-textSecondary dark:text-dark-textSecondary mt-2 max-w-sm text-center">
                        Estamos trabajando en esta función para que puedas consultar tus cotizaciones pasadas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
