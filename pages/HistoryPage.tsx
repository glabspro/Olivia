import React from 'react';
import { History } from 'lucide-react';

const HistoryPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 relative">
                    <div className="absolute -left-2 top-1 bottom-1 w-1 bg-accent-coral rounded-full"></div>
                    <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary ml-2">Historial de Cotizaciones</h2>
                    <p className="text-textSecondary dark:text-dark-textSecondary mt-1 ml-2">
                        Aquí podrás ver todas las cotizaciones que has generado.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center h-96 bg-background dark:bg-dark-surface border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <History size={48} className="text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold text-textPrimary dark:text-dark-textPrimary">Próximamente</h3>
                    <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                        Esta función está en desarrollo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;