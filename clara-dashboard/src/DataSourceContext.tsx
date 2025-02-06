import { createContext, useContext, createSignal, ParentComponent } from 'solid-js';

interface DataSourceContextType {
    dataSource: () => string;
    setDataSource: (source: string) => void;
}

const DataSourceContext = createContext<DataSourceContextType>();

export const DataSourceProvider: ParentComponent = (props) => {
    const [dataSource, setDataSource] = createSignal('ao');

    return (
        <DataSourceContext.Provider value={{ dataSource, setDataSource }}>
            {props.children}
        </DataSourceContext.Provider>
    );
};

// Custom hook for easy usage.
export const useDataSource = () => {
    const context = useContext(DataSourceContext);
    if (!context) throw new Error("useDataSource must be used within a DataSourceProvider");
    return context;
};
