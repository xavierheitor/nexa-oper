/**
 * ThemeProvider - Provedor de tema personalizado para a aplicação
 *
 * Este componente fornece um sistema completo de temas (claro/escuro) integrado
 * com o Ant Design, incluindo persistência no localStorage e personalização
 * de cores específicas da marca Sympla.
 *
 * FUNCIONALIDADES:
 * - Tema claro e escuro
 * - Persistência no localStorage
 * - Paleta de cores personalizada da Sympla
 * - Integração completa com Ant Design
 * - Context API para compartilhar estado do tema
 * - Atributo data-theme no body para CSS customizado
 *
 * COMO USAR:
 * ```tsx
 * // 1. Envolver a aplicação com o ThemeProvider
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * // 2. Usar o hook em qualquer componente
 * function MyComponent() {
 *   const { mode, toggleTheme } = useThemeMode();
 *
 *   return (
 *     <Button onClick={toggleTheme}>
 *       Tema atual: {mode}
 *     </Button>
 *   );
 * }
 * ```
 *
 * ESTRUTURA:
 * - ThemeContext: Context para compartilhar estado
 * - useThemeMode: Hook para acessar o tema
 * - symplaPallete: Paleta de cores da marca
 * - themeConfig: Configurações específicas para cada tema
 * - ThemeProvider: Componente principal que gerencia tudo
 */
'use client';

import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import { createContext, useContext, useEffect, useState } from 'react';

// Algoritmos de tema do Ant Design
const { defaultAlgorithm, darkAlgorithm } = antdTheme;

// Tipo para os modos de tema disponíveis
type ThemeMode = 'light' | 'dark';

// Interface para o contexto do tema
interface ThemeContextProps {
  mode: ThemeMode;           // Modo atual do tema
  toggleTheme: () => void;   // Função para alternar entre temas
}

// Contexto do tema com valores padrão
const ThemeContext = createContext<ThemeContextProps>({
  mode: 'light',
  toggleTheme: () => { },
});

// Hook personalizado para acessar o contexto do tema
export const useThemeMode = () => useContext(ThemeContext);

/**
 * Paleta de cores personalizada da Sympla
 * 
 * Esta paleta define as cores principais da marca Sympla,
 * garantindo consistência visual em toda a aplicação.
 * 
 * CORES:
 * - darkBlue: Cinza escuro principal (headers, menus)
 * - mediumBlue: Cinza médio (botões primários, links)
 * - lightBlue: Cinza claro (hover, seleções)
 * - offWhite: Branco off (fundo claro)
 * - red: Vermelho (erros, alertas)
 * - neutral: Tons neutros para equilíbrio
 */
const symplaPallete = {
  darkBlue: '#374151',      // Cinza escuro - cor principal
  mediumBlue: '#6B7280',    // Cinza médio - cor secundária
  lightBlue: '#9CA3AF',     // Cinza claro para hover e seleções
  offWhite: '#F8FAFC',      // Branco off mais neutro
  red: '#E63946',           // Vermelho - cor de alerta
  neutral: {
    gray50: '#F8FAFC',      // Fundo muito claro
    gray100: '#F1F5F9',     // Fundo claro
    gray200: '#E2E8F0',     // Bordas claras
    gray300: '#CBD5E1',     // Bordas médias
    gray400: '#94A3B8',     // Texto secundário
    gray500: '#64748B',     // Texto médio
    gray600: '#475569',     // Texto escuro
    gray700: '#334155',     // Texto muito escuro
    gray800: '#1E293B',     // Fundo escuro
    gray900: '#0F172A',     // Fundo muito escuro
  },
};

/**
 * Configuração de temas para o Ant Design
 *
 * Define como cada componente do Ant Design deve ser renderizado
 * em cada modo de tema, incluindo cores, algoritmos e estilos específicos.
 *
  * TEMA CLARO:
 * - Algoritmo padrão do Ant Design
 * - Cores baseadas na paleta Sympla (tons de cinza)
 * - Menu com fundo cinza escuro
 * - Layout com sidebar cinza escuro
 *
 * TEMA ESCURO:
 * - Algoritmo escuro do Ant Design
 * - Cores adaptadas para modo escuro
 * - Layout com fundo escuro
 * - Menu com cores contrastantes
 */
const themeConfig = {
  light: {
    algorithm: defaultAlgorithm,  // Algoritmo padrão (claro)
    token: {
      colorPrimary: symplaPallete.mediumBlue,    // Cor primária (botões, links)
      colorBgBase: symplaPallete.neutral.gray50, // Fundo base mais neutro
      colorText: symplaPallete.neutral.gray700,  // Texto principal mais suave
      colorTextSecondary: symplaPallete.neutral.gray500, // Texto secundário
      colorBorder: symplaPallete.neutral.gray200, // Bordas mais suaves
      colorBorderSecondary: symplaPallete.neutral.gray100, // Bordas secundárias
      borderRadius: 8,                           // Bordas mais arredondadas
      colorFillSecondary: symplaPallete.neutral.gray100, // Fundo secundário
    },
    components: {
      Menu: {
        itemBg: symplaPallete.darkBlue,          // Fundo dos itens do menu
        itemColor: symplaPallete.neutral.gray50, // Cor do texto dos itens
        itemHoverColor: symplaPallete.lightBlue, // Cor no hover
        itemSelectedColor: symplaPallete.lightBlue, // Cor do item selecionado
        itemSelectedBg: symplaPallete.neutral.gray800, // Fundo do item selecionado
        subMenuBg: symplaPallete.mediumBlue,     // Fundo dos submenus
      },
      Layout: {
        siderBg: symplaPallete.darkBlue,         // Fundo da sidebar
        bodyBg: symplaPallete.neutral.gray50,    // Fundo do corpo
      },
      Card: {
        colorBgContainer: symplaPallete.neutral.gray100, // Fundo do card ligeiramente mais escuro
        colorBorderSecondary: symplaPallete.neutral.gray200, // Borda do card
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // Sombra sutil para profundidade
      },
      Button: {
        borderRadius: 8,                         // Botões mais arredondados
      },
      Input: {
        borderRadius: 8,                         // Inputs mais arredondados
        colorBorder: symplaPallete.neutral.gray300, // Borda dos inputs
        colorBorderHover: symplaPallete.mediumBlue, // Borda no hover
      },
    },
  },
  dark: {
    algorithm: darkAlgorithm,     // Algoritmo escuro
    token: {
      colorPrimary: symplaPallete.lightBlue,     // Cor primária (azul claro)
      colorBgBase: symplaPallete.neutral.gray900, // Fundo base escuro
      colorText: symplaPallete.neutral.gray50,   // Texto claro
      colorTextSecondary: symplaPallete.neutral.gray300, // Texto secundário
      colorBorder: symplaPallete.neutral.gray700, // Bordas escuras
      colorBorderSecondary: symplaPallete.neutral.gray800, // Bordas secundárias
      borderRadius: 8,                           // Bordas mais arredondadas
      colorFillSecondary: symplaPallete.neutral.gray800, // Fundo secundário
    },
    components: {
      Layout: {
        siderBg: symplaPallete.neutral.gray800,  // Sidebar escura
        bodyBg: symplaPallete.neutral.gray900,   // Fundo do corpo
      },
      Menu: {
        itemColor: symplaPallete.neutral.gray300, // Texto dos itens (cinza claro)
        itemSelectedColor: symplaPallete.lightBlue, // Item selecionado (azul claro)
        itemSelectedBg: symplaPallete.neutral.gray700, // Fundo do item selecionado
        itemHoverBg: symplaPallete.neutral.gray700, // Fundo no hover
      },
      Card: {
        colorBgContainer: symplaPallete.neutral.gray800, // Fundo do card escuro
        colorBorderSecondary: symplaPallete.neutral.gray700, // Borda do card
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // Sombra mais intensa para tema escuro
      },
      Button: {
        borderRadius: 8,                         // Botões mais arredondados
      },
      Input: {
        borderRadius: 8,                         // Inputs mais arredondados
        colorBorder: symplaPallete.neutral.gray600, // Borda dos inputs
        colorBorderHover: symplaPallete.lightBlue, // Borda no hover
      },
    },
  },
};

/**
 * Componente principal do ThemeProvider
 *
 * Gerencia o estado do tema, persistência no localStorage e aplicação
 * das configurações de tema para toda a aplicação.
 *
 * FUNCIONALIDADES:
 * - Estado do tema (light/dark)
 * - Persistência no localStorage
 * - Aplicação do atributo data-theme no body
 * - Fornecimento do contexto para toda a árvore de componentes
 * - Integração com Ant Design via ConfigProvider
 *
 * @param children - Componentes filhos que terão acesso ao tema
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Estado do modo do tema (inicia como 'light')
  const [mode, setMode] = useState<ThemeMode>('light');

  // Efeito para carregar tema salvo do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    // Valida se o valor salvo é válido antes de aplicar
    if (saved === 'dark' || saved === 'light') {
      setMode(saved);
    }
  }, []);

  // Efeito para aplicar o atributo data-theme no body
  // Isso permite CSS customizado baseado no tema
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', mode);
    }
  }, [mode]);

  // Função para alternar entre temas
  const toggleTheme = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);                              // Atualiza o estado
    localStorage.setItem('theme', next);        // Salva no localStorage
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ConfigProvider theme={themeConfig[mode]}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
