import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("name", ["name"], { unique: true })
@Entity("current_svars")
export class CurrentSvars {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", unique: true, length: 255 })
  name: string;

  @Column("varchar", { name: "value", length: 255 })
  value: string;
}
