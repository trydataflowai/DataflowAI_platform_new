import React from 'react';
import styles from '../../styles/Marketplace.module.css';

export const Marketplace = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Marketplace</h1>
      <p className={styles.description}>
        Bienvenido al Marketplace de DataFlow AI.
      </p>
      <button className={styles.button}>
        Explorar
      </button>
    </div>
  );
};
