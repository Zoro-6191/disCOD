import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("ipalias", ["ip", "clientId"], { unique: true })
@Index("client_id", ["clientId"], {})
@Entity("ipaliases", { schema: "bonk" })
export class Ipaliases {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "num_used", unsigned: true, default: () => "'0'" })
  numUsed: number;

  @Column("varchar", { name: "ip", length: 16 })
  ip: string;

  @Column("int", { name: "client_id", unsigned: true, default: () => "'0'" })
  clientId: number;

  @Column("int", { name: "time_add", unsigned: true, default: () => "'0'" })
  timeAdd: number;

  @Column("int", { name: "time_edit", unsigned: true, default: () => "'0'" })
  timeEdit: number;
}
