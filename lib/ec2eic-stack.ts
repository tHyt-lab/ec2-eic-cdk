import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnInstanceConnectEndpoint,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class Ec2EicStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new Vpc(this, "VPC", {
      maxAzs: 1,
      subnetConfiguration: [
        {
          name: "private",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // SecurityGroup
    const instanceSG = new SecurityGroup(this, "InstanceSG", {
      vpc,
    });

    const eicSG = new SecurityGroup(this, "EICSG", {
      vpc,
      allowAllOutbound: false,
    });

    instanceSG.addIngressRule(eicSG, Port.tcp(22));
    eicSG.addEgressRule(instanceSG, Port.tcp(22));

    // EC2Instance
    new Instance(this, "Instance", {
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2023(),
      securityGroup: instanceSG,
    });

    // EC2EIP
    new CfnInstanceConnectEndpoint(this, "EIP", {
      subnetId: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_ISOLATED }).subnetIds[0],
      securityGroupIds: [eicSG.securityGroupId],
    });
  }
}
