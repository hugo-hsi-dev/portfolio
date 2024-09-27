import Block from '@/components/blocks/primitives/Block'
import Button, { ButtonBackground, ButtonContent } from '@/components/button/Button'
import { Github, Linkedin, Mail, Plus } from 'lucide-react'

export default function ContactBlock() {
  return (
    <Block id="contact" className="bg-black">
      <div className="flex flex-col items-center h-full">
        <div className="h-full flex justify-center items-center">
          <Button>
            <ButtonContent>
              <Plus />
            </ButtonContent>
            <ButtonBackground style={{ borderRadius: '50%' }} className="bg-lime-500" />
          </Button>
        </div>
        <div className="flex gap-6 w-full">
          <Button className="w-full">
            <ButtonContent>
              <Mail />
            </ButtonContent>
            <ButtonBackground />
          </Button>
          <Button className="w-full">
            <ButtonContent>
              <Github />
            </ButtonContent>
            <ButtonBackground />
          </Button>
          <Button className="w-full">
            <ButtonContent>
              <Linkedin />
            </ButtonContent>
            <ButtonBackground />
          </Button>
        </div>
      </div>
    </Block>
  )
}
