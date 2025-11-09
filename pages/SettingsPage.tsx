import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsType, MarginType } from '../types';
import AppSettings from '../components/Settings';

interface SettingsPageProps {
    user: User;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
    const [settings, setSettings] = useState<SettingsType>({
        companyName: user.companyName,
        companyLogo: null,
        currencySymbol: 'S/',
        defaultMarginType: MarginType.PERCENTAGE,
        defaultMarginValue: 20,
    });
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(`oliviaSettings_${user.id}`);
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
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
            setSaveMessage('¡Configuración guardada exitosamente!');
            setTimeout(() => setSaveMessage(''), 3000); // Hide message after 3 seconds
        } catch (e) {
            console.error("Failed to save settings to localStorage", e);
            setSaveMessage('Error al guardar la configuración.');
        }
    };
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 relative">
                    <div className="absolute -left-2 top-1 bottom-1 w-1 bg-accent-yellow rounded-full"></div>
                    <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary ml-2">Configuración</h2>
                    <p className="text-textSecondary dark:text-dark-textSecondary mt-1 ml-2">
                        Personaliza la información de tu empresa y los valores por defecto.
                    </p>
                </div>

                <div className="bg-background dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <AppSettings currentSettings={settings} onSave={handleSaveSettings} />
                </div>
                
                {saveMessage && (
                    <div className="mt-6 text-center text-green-600 dark:text-green-400 font-semibold">
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;