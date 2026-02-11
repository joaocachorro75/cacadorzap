# Guia de Deploy Easypanel (Resolvendo o Erro)

O erro `Could not read package.json` acontece porque o Easypanel não tem acesso aos seus arquivos `.tsx`, `.ts` e `.json`. 

### Como Corrigir no Easypanel:

1. **Repositório Git (Obrigatório):**
   - O Easypanel precisa de uma fonte de arquivos. 
   - Crie um repositório no GitHub/GitLab.
   - Envie **TODOS** os arquivos que aparecem no projeto (inclusive as pastas).
   - No Easypanel, em **General > Source**, escolha **GitHub** e conecte seu repositório.

2. **Configuração do Dockerfile:**
   - Em **General > Build**, mude o "Build Method" para **Dockerfile**.
   - No campo "Dockerfile Path", coloque: `deploy.Dockerfile`.

3. **Variáveis de Ambiente:**
   - Vá em **Environment** no Easypanel.
   - Adicione a chave `API_KEY` com o seu token do Google Gemini.

4. **Deploy:**
   - Clique em **Deploy**. Agora, o Docker vai encontrar o `package.json` porque ele vai baixar o seu código do GitHub antes de iniciar o build.

### Se você não quiser usar GitHub:
- Você terá que usar a opção "App Service" do Easypanel e, via terminal (SSH) no seu servidor, copiar os arquivos para a pasta `/etc/easypanel/projects/[nome-do-projeto]/code/`.
