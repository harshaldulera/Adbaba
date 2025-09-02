import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface BusinessContextType {
    businessId: string | null;
    setBusinessId: (id: string | null) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [ businessId, setBusinessId ] = useState<string | null>("0627adf0-4164-40a7-8c9e-738ed88f4dcf");

    return (
        <BusinessContext.Provider value={{ businessId, setBusinessId }}>
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusinessContext() {
    const context = useContext(BusinessContext);
    if ( context === undefined ) {
        throw new Error("useBusinessContext must be used within a BusinessProvider");
    } 
    return context;
}