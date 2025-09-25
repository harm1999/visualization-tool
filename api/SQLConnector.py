from sqlalchemy import (
    create_engine, Column, Integer, String, NVARCHAR, JSON, CheckConstraint,
    PrimaryKeyConstraint, event, DDL, MetaData, inspect, func, literal, Text, or_, delete
)
import os
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.types import TypeDecorator
from tqdm import tqdm


Base = declarative_base()

class Edge(Base):
    __tablename__ = 'edges'
    __table_args__ = (
        PrimaryKeyConstraint('source', 'target', 'etype', name='PK_edges'),
    )

    source = Column(Integer, nullable=False)
    target = Column(Integer, nullable=False)
    etype = Column(String(100), nullable=False)

class Node(Base):
    __tablename__ = 'nodes'
    # __table_args__ = (
    #     CheckConstraint("ISJSON(props)=1", name="CHK_nodes_props_json"),
    # )

    id    = Column(Integer, primary_key=True, nullable=False)
    name  = Column(String(511), nullable=False)
    lowername = Column(String, nullable=False)
    node = Column(JSON())  # NVARCHAR(MAX)

class TraceNodes(Base):
    __tablename__ = 'trace_nodes'

    __table_args__ = (
        PrimaryKeyConstraint('testname', 'id', name='PK_leaf'),
    )

    testname = Column(String(100), nullable=False)
    id = Column(Integer, nullable=False)
    nodeid = Column(Integer)
    functionid = Column(Integer)
    time = Column(Integer)
    starttime = Column(Integer)
    caller = Column(Integer)
    status = Column(JSON())
    cvizClass = Column(String(100))
    cvizFunction = Column(String(100))

class Functions(Base):
    __tablename__ = 'functions'


    id      = Column(Integer, primary_key=True, nullable=False)
    name    = Column(String(511), nullable=False)
    node    = Column(JSON())  # NVARCHAR(MAX)
    parent  = Column(Integer, nullable=False)

    

event.listen(
    Edge.__table__,
    'before_create',
    DDL('DROP TYPE IF EXISTS %(table)s CASCADE')
)

event.listen(
    Node.__table__,
    'before_create',
    DDL('DROP TYPE IF EXISTS %(table)s CASCADE')
)

event.listen(
    TraceNodes.__table__,
    'before_create',
    DDL('DROP TYPE IF EXISTS %(table)s CASCADE')
)

event.listen(
    Functions.__table__,
    'before_create',
    DDL('DROP TYPE IF EXISTS %(table)s CASCADE')
)

class SQLConnector:
    BATCH_SIZE = 10_000

    def __init__(self):
        server   = os.getenv('DB_HOST', 'localhost')
        port     = os.getenv('DB_PORT', 5432)
        database = os.getenv('DB_NAME', 'new_tool')
        user     = os.getenv('DB_USER', 'postgres')
        password = os.getenv('DB_PASSWORD', '')

        # Note the "mssql+pyodbc" URL; replace DRIVER if needed.
        conn_url = (
            f"postgresql+psycopg2://{user}:{password}"
            f"@{server}:{port}/{database}"
        )
        self.engine = create_engine(conn_url, echo=False, future=True)
        self.Session = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)
        self.metadata = MetaData(schema=database)
        Base.metadata.schema = database

    def init_db(self):
        inspector = inspect(self.engine)
        if not inspector.has_table('edges', schema=self.metadata.schema):
            Base.metadata.create_all(self.engine)
            print("Created missing tables.")
        else:
            print("Tables already exist; nothing to do.")

    def close_db(self):
        self.engine.dispose()

    def add_constraints(self, q, constraints, model):
        for item in constraints:
            col_names = item['column'] if isinstance(item['column'], list) else [ item['column'] ]
            columns = [getattr(model, col_name, None) for col_name in col_names]
            
            for i, column in enumerate(columns):
                if column is None:
                    raise ValueError(f"Invalid filter column: {col_names[i]}")

            if item['type'] == "not_in":
                vals = item["values"]
                if not isinstance(vals, (list, tuple, set)):
                    raise ValueError(f"`not_in` value for {item['column']} must be a list/tuple/set")
                q = q.filter(or_(*[column.notin_(vals) for column in columns]))
            elif item['type'] == "in":
                vals = item["values"]
                if not isinstance(vals, (list, tuple, set)):
                    raise ValueError(f"`in` value for {item['column']} must be a list/tuple/set")
                q = q.filter(or_(*[column.in_(vals) for column in columns]))
            elif item['type'] == "equals":
                q = q.filter(or_(*[column == item["value"]]))
            elif item['type'] =="string_count_geq":
                substr_len = len(item['string'])
                q = q.filter(or_(*[(
                    (func.length(column)
                        - func.length(func.replace(column, literal(item['string']), literal(""))))
                    / literal(substr_len)
                ) >= literal(item['value']) for column in columns]))
            elif item['type'] == 'neq_column':
                c2 = getattr(model, item['value'], None)
                if c2 is None:
                    raise ValueError(f"Invalid filter column: {item['value']}")
                
                q = q.filter(*[
                    left != c2
                    for left in columns
                ])
        return q
                    
    def delete(self, constraints, table):
        model = self.get_table(table)
        session = self.Session()

        try:
            # build the base query
            q = session.query(model)

            # apply the same filters you use in .query()
            q = self.add_constraints(q, constraints, model)

            # perform the delete and commit
            count = q.delete(synchronize_session=False)
            session.commit()

            return count

        finally:
            session.close()
            
    def query(self, constraints, table, queryType="all", distinct_cols=False):
        model = self.get_table(table)
        session = self.Session()

        try:
            if not distinct_cols:
                q = session.query(model)
            else:
                
                q = session.query(*[getattr(model, n) for n in distinct_cols]).distinct()

            q = self.add_constraints(q, constraints, model)   

            # choose all() vs first()
            if queryType == "all":
                results = q.all()
            else:
                first = q.first()
                results = [first] if first else []
            
            if not distinct_cols:
                # dynamically pull out all column names
                cols = [c.key for c in inspect(model).mapper.column_attrs]

                # convert ORM rows to dicts
                return [{col: getattr(row, col) for col in cols} for row in results]
            else:
                return set(results)

        finally:
            session.close()

    def get_table(self, table):
        match table:
            case "edges":
                model = Edge
            case "nodes":
                model = Node
            case "trace_nodes":
                model = TraceNodes
            case "functions":
                model = Functions
        return model

    def add_records(self, records, table, delete_table = True):
        """
        records: list of dicts
        table: the table (Node or Edge)
        """
        session = self.Session()
        model = self.get_table(table)

        try:
            # Build a PostgreSQL INSERT … ON CONFLICT DO NOTHING
            
            if delete_table:
                session.execute(delete(model))
                session.commit()

            for i, batch in enumerate(self._chunked(records, self.BATCH_SIZE)):
                print(i, "/", int(len(records)/self.BATCH_SIZE))
                stmt = (
                    pg_insert(model.__table__)
                    .values(batch)
                    .on_conflict_do_nothing()
                )
                session.execute(stmt)

                session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()

    def _chunked(self, seq, size):
        """Yield successive size-length chunks from seq."""
        for i in range(0, len(seq), size):
            yield seq[i : i + size]