'use client';

import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import { createContext, useContext, useEffect, useState } from 'react';

const { defaultAlgorithm, darkAlgorithm } = antdTheme;

type ThemeMode = 'light' | 'dark';

interface ThemeContextProps {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  mode: 'light',
  toggleTheme: () => { },
});

export const useThemeMode = () => useContext(ThemeContext);

// Paleta personalizada
const symplaPallete = {
  darkBlue: '#1D3557',
  mediumBlue: '#457B9D',
  lightBlue: '#A8DADC',
  offWhite: '#F1FAEE',
  red: '#E63946',
};

const themeConfig = {
  light: {
    algorithm: defaultAlgorithm,
    token: {
      colorPrimary: symplaPallete.mediumBlue,
      colorBgBase: symplaPallete.offWhite,
      colorText: symplaPallete.darkBlue,
    },
    components: {
      Menu: {
        itemBg: symplaPallete.darkBlue,
        itemColor: symplaPallete.offWhite,
        itemHoverColor: symplaPallete.lightBlue,
        itemSelectedColor: symplaPallete.lightBlue,
        itemSelectedBg: '#000c17',
        subMenuBg: symplaPallete.mediumBlue, // <- Usada se quiser
      },
      Layout: {
        siderBg: symplaPallete.darkBlue,
      },
    },
  },
  dark: {
    algorithm: darkAlgorithm,
    token: {
      colorPrimary: symplaPallete.lightBlue,
      colorBgBase: '#141414',
      colorText: '#ffffff',
    },
    components: {
      Layout: {
        siderBg: '#1D1D1D',
      },
      Menu: {
        itemColor: '#ccc',
        itemSelectedColor: symplaPallete.lightBlue,
        itemSelectedBg: '#000',
      },
    },
  },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', mode);
    }
  }, [mode]);

  const toggleTheme = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('theme', next);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ConfigProvider theme={themeConfig[mode]}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
