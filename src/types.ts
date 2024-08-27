declare module '@mappable-world/mappable-types/import' {
    interface Import {
        (pkg: '@mappable-world/mappable-clusterer'): Promise<typeof import('./index')>;
    }
}

export {};
