import { useThemeMode } from '@/lib/providers/ThemeProvider';
import { Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Switch
      checked={mode === 'dark'}
      onChange={toggleTheme}
      checkedChildren={<BulbFilled />}
      unCheckedChildren={<BulbOutlined />}
    />
  );
};

export default ThemeToggle;
