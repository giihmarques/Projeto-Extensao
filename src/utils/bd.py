"""Conexão com o banco de dados MySQL para o projeto Tech-Trade.

Esta implementação usa `mysql.connector` e permite configuração via variáveis
de ambiente. Em ambientes sem MySQL disponível, a importação deve ainda
funcionar (a tentativa de conectar só ocorre quando a classe é instanciada).
"""

from os import environ
import mysql.connector
from mysql.connector import Error


class ConexaoBD:
	def __init__(self):
		# Preferir variáveis de ambiente para configuração; manter valores padrão locais
		host = environ.get("DB_HOST", "localhost")
		user = environ.get("DB_USER", "root")
		password = environ.get("DB_PASSWORD", "")
		database = environ.get("DB_NAME", "techtrade_db")

		try:
			self.con = mysql.connector.connect(
				host=host,
				user=user,
				password=password,
				database=database
			)
			self.cursor = self.con.cursor()
		except Error as err:
			# Re-raise a exceção para que o chamador trate (por exemplo, rota Flask)
			raise RuntimeError(f"Erro ao conectar ao banco de dados: {err}")

	def select(self, query, params=None):
		"""Executa um SELECT e retorna todos os registros como lista de tuplas."""
		self.cursor.execute(query, params or ())
		return self.cursor.fetchall()

	def insert(self, query, params=None):
		"""Executa um INSERT e retorna o id inserido quando disponível."""
		self.cursor.execute(query, params or ())
		self.con.commit()
		try:
			return self.cursor.lastrowid
		except Exception:
			return None

	def update(self, query, params=None):
		self.cursor.execute(query, params or ())
		self.con.commit()
		return True

	def delete(self, query, params=None):
		self.cursor.execute(query, params or ())
		self.con.commit()
		return True

	def close(self):
		try:
			if hasattr(self, 'cursor') and self.cursor:
				self.cursor.close()
			if hasattr(self, 'con') and self.con:
				self.con.close()
		except Exception:
			pass

