# Usamos la imagen oficial de MongoDB como base, ya que incluye mongosh
FROM mongo:latest

# Copiar nuestro script de inicialización al contenedor
COPY init-mongo-cluster.sh /init-mongo-cluster.sh

# Darle permisos de ejecución
RUN chmod +x /init-mongo-cluster.sh

# Establecer el script como el comando por defecto que se ejecutará cuando el contenedor inicie
CMD ["/init-mongo-cluster.sh"]