import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface BusinessData {
    name?: string;
    industry?: string;
    description?: string;
    website?: string;
    founded_year?: string;
    hq_location?: string;
    business_size?: string;
    target_age_group?: string;
    target_gender?: string;
    customer_interests?: string;
    customer_behavior?: string;
    marketing_budget?: string;
    customer_acquisition_cost?: string;
    content_strategy?: string;
    target_location?: string;
}

interface BusinessContextType {
    businessId: string | null;
    setBusinessId: (id: string | null) => void;
    businessData: BusinessData | null;
    setBusinessData: (data: BusinessData | null) => void;
    funnelPromise: Promise<any> | null;
    preFetchFunnel: (data: BusinessData) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [ businessId, setBusinessId ] = useState<string | null>("0627adf0-4164-40a7-8c9e-738ed88f4dcf");
    const [ businessData, setBusinessData ] = useState<BusinessData | null>(null);
    const [ funnelPromise, setFunnelPromise ] = useState<Promise<any> | null>(null);
    const [ lastFetchedDataHash, setLastFetchedDataHash ] = useState<string>("");

    const preFetchFunnel = (data: BusinessData) => {
        const currentHash = JSON.stringify(data);
        if (currentHash === lastFetchedDataHash) {
            console.log("Data hasn't changed, skipping pre-fetch");
            return;
        }

        console.log("Starting speculative pre-fetch...");
        const promise = fetch("http://localhost:3000/generate-funnel-flow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessData: data }),
        })
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch funnel data");
            return res.json();
        })
        .catch(err => {
            console.error("Pre-fetch failed:", err);
            return null; // Return null on failure so we can retry or handle it
        });

        setFunnelPromise(promise);
        setLastFetchedDataHash(currentHash);
    };

    return (
        <BusinessContext.Provider value={{ 
            businessId, 
            setBusinessId, 
            businessData, 
            setBusinessData,
            funnelPromise,
            preFetchFunnel
        }}>
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