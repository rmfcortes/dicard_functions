export interface ClientToken {
    idConekta: string;
    token: string;
    email: string;
    name: string;
}


export interface Order {
    accepted: boolean
    customer: Customer
    comision: number
    createdAt: number
    delivery_cost: number,
    tip: number,
    products: Product[],
    total: number,
    progress: Progress[],
    payment: Payments,
    id?: string,
    idPaymente?: string
}

export interface Customer {
    direccion: Address
    telefono: string
}

export interface Address {
    address: string;
    lat: number;
    lng: number;
    pin?: string;
    poi?: string;
    dark?: boolean;
}

export interface Product {
    code?: string;
    description: string;
    id: string;
    name: string;
    section: string;
    price: number;
    unit?: string;
    url: string;
    extras?: SelectedExtras[];
    has_extras: boolean;
    new: boolean;
    stock: boolean;
    qty: number;
    total: number;
    comments: string;
    added?: number;
    idAsCart?: string;
}

export interface Progress {
    date: number;
    concept: string;
}

export interface Payments {
    id?: string;
    src: string;
    vendor: string;
}

export interface SelectedExtras {
    header: string;
    products: Extra[];
    radioSelected?: number;
}

export interface Extra {
    name: string;
    price: number;
    isChecked?: boolean;
    unavailable?: boolean;
}

export interface Item {
    id: string;
    name: string;
    unit_price: number;
    quantity: number;
}
