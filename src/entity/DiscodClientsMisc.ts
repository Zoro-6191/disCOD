import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("client_id", ["clientId"], { unique: true })
@Entity("discod_clients_misc", { schema: "bonk" })
export class DiscodClientsMisc {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "client_id", unique: true })
  clientId: number;

  @Column("varchar", {
    name: "steam_id",
    nullable: true,
    length: 36,
    default: () => "'0'",
  })
  steamId: string | null;

  @Column("varchar", { name: "reso", nullable: true, length: 10 })
  reso: string | null;

  @Column("int", { name: "time_add" })
  timeAdd: number;

  @Column("int", { name: "time_edit" })
  timeEdit: number;
}
