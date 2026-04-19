import styles from './OptionItem.module.css';
import { renderMarkdown } from '../utils/parseQuestion';

export default function OptionItem({ optKey, text, checked, inputType, name, onChange, disabled }) {
  return (
    <label className={`${styles.label} ${checked ? styles.selected : ''}`}>
      <input
        type={inputType}
        name={name}
        value={optKey}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.key}>{optKey}</span>
      <span
        className={styles.text}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
      />
      {/* Selection indicator ring */}
      <span className={styles.ring} aria-hidden="true" />
    </label>
  );
}
