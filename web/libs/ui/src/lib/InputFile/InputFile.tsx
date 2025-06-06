import { IconUpload } from "../../assets/icons";
import clsx from "clsx";
import {useTranslation} from 'react-i18next';
type InputFileProps = HTMLAttributes<HTMLInputElement> & {
  name?: string;
  className?: string;
  text?: React.ReactNode | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  props?: Record<string, any>;
};

import styles from "./InputFile.module.scss";
import type React from "react";
import { forwardRef, type HTMLAttributes, useCallback, useRef } from "react";
export const InputFile = forwardRef(({ name, className, text, onChange, ...props }: InputFileProps, ref: any) => {
  const {t} = useTranslation();
  
  if (!ref) {
    ref = useRef();
  }
  const interactiveKeys = ["Space", " "];
  const wrapperKeyDownHandler = useCallback(
    (e: any) => {
      if (interactiveKeys.includes(e.key)) {
        e.preventDefault();
        ref.current.click();
      }
    },
    [ref],
  );
  return (
    <label className={clsx(styles.inputWrapper, className)} onKeyDown={wrapperKeyDownHandler}>
      <span className={styles.labelContent}>
        <IconUpload className={styles.icon} /> {text ?? <>{t('common_button_upload_image')}</>}
      </span>
      <input
        ref={ref}
        type="file"
        className={clsx("file-input", styles.input)}
        name={name}
        {...props}
        onChange={onChange}
        tabIndex={-1}
      />
    </label>
  );
});
