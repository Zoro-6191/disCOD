import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("client_id", ["clientId"], { unique: true })
@Entity("discod_vpn_allowed")
export class DiscodVpnAllowed extends BaseEntity
{
    @PrimaryGeneratedColumn({ 
        type: "int", 
        name: "id" 
    })
    id: number;

    @Column("int", { 
        name: "client_id", 
        unique: true 
    })
    clientId: number;
}
