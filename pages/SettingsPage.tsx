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
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-textPrimary dark:text-dark-textPrimary relative pb-2">
                        Configuración
                        <span className="absolute bottom-0 left-0 h-1 w-16 bg-accent-yellow rounded-full"></span>
                    </h2>
                    <p className="text-textSecondary dark:text-dark-textSecondary mt-2">
                        Personaliza la información de tu empresa y los valores por defecto.
                    </p>
                </div>

                <div className="bg-surface dark:bg-dark-surface rounded-lg border border-border dark:border-dark-border p-6 shadow-sm">
                    <AppSettings currentSettings={settings} onSave={handleSaveSettings} />
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