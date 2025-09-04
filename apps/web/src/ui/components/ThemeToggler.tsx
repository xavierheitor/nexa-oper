import { useThemeMode } from '@/ui/providers/ThemeProvider';
import { BulbFilled, BulbOutlined } from '@ant-design/icons';
import { Switch } from 'antd';

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
