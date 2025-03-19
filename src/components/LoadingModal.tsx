import { useEffect, useState } from 'react';
import styles from './LoadingModal.module.css';

export default function LoadingModal({ isLoading }: { isLoading: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className={`${styles.overlay} ${!isLoading ? styles.fadeOut : ''}`}>
      <div className={styles.modal}>
        <div className={styles.loader}></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}
